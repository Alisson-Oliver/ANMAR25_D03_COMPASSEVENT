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
}
