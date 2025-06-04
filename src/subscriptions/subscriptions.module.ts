import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscriptions.controller';
import { SubscriptionService } from './subscriptions.service';
import { S3Module } from '../storages/aws-s3.module';
import { DynamodbModule } from '../database/dynamodb.module';
import { SESMailModule } from '../emails/aws-ses.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { EventModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    S3Module,
    DynamodbModule,
    SESMailModule,
    JwtModule,
    UsersModule,
    EventModule,
    AuthModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
