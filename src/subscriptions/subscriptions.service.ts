import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DynamoDBService } from '../database/dynamodb.service';
import { ICalendarAttachment, SESMailService } from '../emails/aws-ses.service';
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { Status } from '../common/enum/status.enum';
import { UserService } from '../users/users.service';
import { EventService } from '../events/events.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { subscriptionCreatedEmailTemplate } from '../emails/templates/subscriptions/subscription-created-email.template';
import { generateICalFile } from '../common/utils/generate-ical-file.util';
import { subscriptionDeletedEmailTemplate } from '../emails/templates/subscriptions/subscription-deleted-email.template';
import { SubscriptionPaginationQueryDto } from './dto/subscription-pagination-query.dto';

@Injectable()
export class SubscriptionService {
  private readonly tableName =
    process.env.DYNAMODB_TABLE_SUBSCRIPTIONS || 'subscriptions';

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly sesMailService: SESMailService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
  ) {}

  async create(data: CreateSubscriptionDto) {
    const subscription = {
      id: uuid(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      status: Status.ACTIVE,
    };

    if (await this.subscriptionExists(data.user_id, data.event_id)) {
      throw new BadRequestException('subscription already exists');
    }

    const user = await this.userService.findById(data.user_id);

    if (user.status === Status.INACTIVE) {
      throw new ForbiddenException('user is not active');
    }

    if (user.emailVerified === false) {
      throw new ForbiddenException('user email is not verified');
    }

    const event = await this.eventService.findById(data.event_id);

    if (event.status === Status.INACTIVE) {
      throw new ForbiddenException('event is not active');
    }

    if (event.date < new Date().toISOString()) {
      throw new ForbiddenException('event date is in the past');
    }

    const organizer = await this.userService.findById(event.organizerId);

    await this.dynamoDBService.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: subscription,
      }),
    );

    const eventDetailsForIcal = {
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: new Date(event.date),
      organizer: organizer.name,
      organizerEmail: organizer.email,
    };

    const icalString = generateICalFile(eventDetailsForIcal);

    const icalAttachment: ICalendarAttachment = {
      fileName: 'invite.ics',
      content: icalString,
      method: 'REQUEST',
    };

    await this.sesMailService.sendEmail(
      user.email,
      `🎟️  Registration Confirmed - ${event.name}`,
      subscriptionCreatedEmailTemplate(
        user.name,
        event.name,
        event.date,
        event.imageUrl,
      ),
      icalAttachment,
    );

    return subscription;
  }

  async findAllById(
    userId: string,
    query: SubscriptionPaginationQueryDto,
  ): Promise<{ count: number; data: any[]; lastKey?: string; page: number }> {
    const { limit = 10, lastKey, page = 1 } = query;

    const params: ScanCommandInput = {
      TableName: this.tableName,
      Limit: Number(limit),
      FilterExpression: 'user_id = :user_id',
      ExpressionAttributeValues: {
        ':user_id': userId,
      },
    };

    if (lastKey) {
      try {
        params.ExclusiveStartKey = JSON.parse(lastKey);
      } catch (error) {
        throw new BadRequestException('Invalid lastKey format.');
      }
    }

    try {
      const result = await this.dynamoDBService.client.send(
        new ScanCommand(params),
      );

      const items = result.Items || [];

      return {
        count: result.Count || 0,
        data: items,
        lastKey: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : undefined,
        page: Number(page),
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findById(subscriptionId: string) {
    try {
      const subscription = await this.dynamoDBService.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            id: subscriptionId,
          },
        }),
      );

      if (!subscription.Item) {
        throw new NotFoundException('subscription not found');
      }
      return subscription.Item;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async softDelete(subscriptionId: string, userId: string) {
    try {
      const subscription = await this.validateSubscription(
        subscriptionId,
        userId,
      );

      const updatedSubscription = {
        ...subscription,
        deletedAt: new Date().toISOString(),
        status: Status.INACTIVE,
      };

      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: updatedSubscription,
        }),
      );

      const user = await this.userService.validateUser(subscription.user_id);

      const event = await this.eventService.validateEvent(
        subscription.event_id,
      );

      await this.sesMailService.sendEmail(
        user.email,
        `  Subscription Cancelled - ${event.name}`,
        subscriptionDeletedEmailTemplate(
          user.name,
          event.name,
          event.date,
          event.imageUrl,
        ),
      );

      return updatedSubscription;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async subscriptionExists(userId: string, eventId: string) {
    try {
      const result = await this.dynamoDBService.client.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'user_id = :user_id AND event_id = :event_id',
          ExpressionAttributeValues: {
            ':user_id': userId,
            ':event_id': eventId,
          },
        }),
      );

      return (result.Count ?? 0) > 0;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateSubscription(subscriptionId: string, userId: string) {
    const subscription = await this.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException('subscription not found');
    }

    if (subscription.user_id !== userId) {
      throw new ForbiddenException(
        "you can't access a subscription that doesn't belong to you",
      );
    }

    if (subscription.deletedAt) {
      throw new BadRequestException('subscription is already deleted');
    }

    if (subscription.status === Status.INACTIVE) {
      throw new BadRequestException('subscription is inactive');
    }

    return subscription;
  }
}
