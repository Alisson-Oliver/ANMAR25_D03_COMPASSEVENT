import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { DynamodbModule } from '../database/dynamodb.module';
import { S3Module } from '../storages/aws-s3.module';
import { SESMailModule } from '../emails/aws-ses.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DynamodbModule,
    S3Module,
    SESMailModule,
    JwtModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
