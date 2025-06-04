import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DynamoDBService } from '../database/dynamodb.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { SESMailService } from '../emails/aws-ses.service';
import { JwtService } from '@nestjs/jwt';
import { verificationEmailTemplate } from '../emails/templates/users/verification-email.template';
import { v4 as uuid } from 'uuid';
import { PatchUserDto } from './dto/patch-user.dto';
import { accountDeletedEmailTemplate } from '../emails/templates/users/account-deleted-email.template';
import { EmailSendStatus } from '../common/enum/email-send-status.enum';
import { Status } from '../common/enum/status.enum';

@Injectable()
export class UserService {
  private readonly tableName = process.env.DYNAMODB_TABLE_USERS || 'users';

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly sesMailService: SESMailService,
    private readonly jwtService: JwtService,
  ) {}

  async create(data: CreateUserDto, imageUrl: string) {
    try {
      if (await this.emailExists(data.email)) {
        throw new ConflictException('email already exists');
      }

      if (await this.phoneExists(data.phone)) {
        throw new ConflictException('phone already exists');
      }

      data.password = await bcrypt.hash(data.password, await bcrypt.genSalt());

      const user = {
        id: uuid(),
        ...data,
        avatar: imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        status: Status.ACTIVE,
        deletedAt: null,
      };

      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: user,
        }),
      );

      await this.sendEmailVerification(user);

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findById(userId: string) {
    try {
      const user = await this.dynamoDBService.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            id: userId,
          },
        }),
      );

      if (!user.Item) {
        throw new NotFoundException('user not found');
      }
      return user.Item;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    try {
      const users = await this.dynamoDBService.client.send(
        new ScanCommand({
          TableName: this.tableName,
        }),
      );

      return { count: users.Count, data: users.Items };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(userId: string, data: PatchUserDto) {
    try {
      if (!data) {
        throw new BadRequestException('No data provided for update');
      }

      const user = await this.validateUser(userId);

      if (data.password) {
        data.password = await bcrypt.hash(
          data.password,
          await bcrypt.genSalt(),
        );
      }

      if (data.email && data.email !== user.email) {
        if (await this.emailExists(data.email)) {
          throw new ConflictException('email already exists');
        }
      }

      if (data.phone && data.phone !== user.phone) {
        if (await this.phoneExists(data.phone)) {
          throw new ConflictException('phone already exists');
        }
      }

      const updatedUser = {
        id: userId,
        ...user,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: updatedUser,
        }),
      );
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async softDelete(userId: string) {
    try {
      const user = await this.validateUser(userId);

      const deletedUser = {
        id: userId,
        ...user,
        status: Status.INACTIVE,
        deletedAt: new Date().toISOString(),
      };
      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: deletedUser,
        }),
      );

      if (process.env.MAIL_FROM_ADDRESS) {
        await this.sesMailService.sendEmail(
          user.email,
          'Your Account Has Been Successfully Deleted',
          accountDeletedEmailTemplate(user.name),
        );
      }

      return true;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyUserEmail(userId: string) {
    try {
      const updatedUser = await this.dynamoDBService.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            id: userId,
          },
          UpdateExpression: 'set emailVerified = :emailVerified',
          ExpressionAttributeValues: {
            ':emailVerified': true,
          },
          ReturnValues: 'ALL_NEW',
        }),
      );

      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async emailExists(email: string) {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
      });
      const result = await this.dynamoDBService.client.send(command);

      return result.Items && result.Items[0] ? result.Items[0] : null;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async phoneExists(phone: string) {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'phone = :phone',
        ExpressionAttributeValues: {
          ':phone': phone,
        },
      });
      const result = await this.dynamoDBService.client.send(command);
      if (result) {
        return (result.Count ?? 0) > 0;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateUser(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    if (user.status === Status.INACTIVE) {
      throw new ForbiddenException('user is inactive');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('email not verified');
    }
    return user;
  }

  private async sendEmailVerification(user: any) {
    const verificationTokenPayload = {
      email: user.email,
      sub: user.id,
      type: 'email-verification',
    };
    const verificationToken = this.jwtService.sign(verificationTokenPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN,
    });

    const verificationLink = `${process.env.API_BASE_URL}/auth/verify-email?token=${verificationToken}`;

    const emailStatus = await this.sesMailService.sendEmail(
      user.email,
      'Confirm your email and start using Compass Events!  🧡',
      verificationEmailTemplate(user.name, verificationLink),
    );

    if (emailStatus === EmailSendStatus.DISABLED) {
      await this.verifyUserEmail(user.id);
    }
  }
}
