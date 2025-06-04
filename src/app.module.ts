import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamodbModule } from './database/dynamodb.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EventModule } from './events/events.module';
import { SubscriptionModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule.forRoot(), DynamodbModule, AuthModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
