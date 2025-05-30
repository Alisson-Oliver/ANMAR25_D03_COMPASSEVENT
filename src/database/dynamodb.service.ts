import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getAwsCredentials } from '../common/utils/awsCredentials.util';

@Injectable()
export class DynamoDBService {
  public readonly client: DynamoDBDocumentClient;
  public readonly logger = new Logger(DynamoDBService.name);

  constructor() {
    const { region, credentials } = getAwsCredentials();

    const db = new DynamoDBClient({
      region,
      credentials,
    });

    this.client = DynamoDBDocumentClient.from(db);
    this.logger.log(`DynamoDB client initialized in region ${region}`);
  }
}
