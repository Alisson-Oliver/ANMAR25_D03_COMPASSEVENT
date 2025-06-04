import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DynamoDBService } from '../database/dynamodb.service';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Role } from '../common/enum/roles.enum';

@Injectable()
export class SeedService {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async createDefaultUser() {
    const defaultUserName = process.env.DEFAULT_USER_NAME;
    const defaultUserEmail = process.env.DEFAULT_USER_EMAIL;
    const defaultUserPassword = process.env.DEFAULT_USER_PASSWORD;
    const tableName = process.env.DYNAMODB_TABLE_USERS || 'users';

    if (!defaultUserName || !defaultUserEmail || !defaultUserPassword) {
      throw new InternalServerErrorException(
        'Environment variables for default user are not set',
      );
    }

    const emailCheckCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': defaultUserEmail,
      },
    });
    const existingUsers =
      await this.dynamoDBService.client.send(emailCheckCommand);

    if (existingUsers.Items && existingUsers.Items.length > 0) {
      Logger.warn(
        `User with email ${defaultUserEmail} already exists. Skipping creation.`,
      );
      return;
    }

    const user = {
      id: uuid(),
      name: defaultUserName,
      email: defaultUserEmail,
      password: await bcrypt.hash(defaultUserPassword, await bcrypt.genSalt()),
      role: Role.ADMIN,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: tableName,
      Item: user,
    };
    await this.dynamoDBService.client.send(new PutCommand(params));
    Logger.log(
      `Default user created with email: ${defaultUserEmail} and role: ${Role.ADMIN}`,
    );
    return;
  }
}
