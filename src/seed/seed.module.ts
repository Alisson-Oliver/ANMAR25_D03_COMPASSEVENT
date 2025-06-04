import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { DynamoDBService } from '../database/dynamodb.service';

@Module({
  providers: [SeedService, DynamoDBService],
  exports: [SeedService],
})
export class SeedModule {}
