import { forwardRef, Module } from '@nestjs/common';
import { EventService } from './events.service';
import { EventController } from './events.controller';
import { S3Module } from '../storages/aws-s3.module';
import { DynamodbModule } from '../database/dynamodb.module';
import { SESMailModule } from '../emails/aws-ses.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DynamodbModule,
    S3Module,
    SESMailModule,
    JwtModule,
    AuthModule,
    UsersModule,
  ],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
