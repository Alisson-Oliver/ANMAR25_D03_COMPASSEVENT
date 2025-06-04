import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Put,
} from '@nestjs/common';
import { DynamoDBService } from '../database/dynamodb.service';
import { SESMailService } from '../emails/aws-ses.service';
import { CreateEventDto } from './dto/create-event.dto';
import { v4 as uuid } from 'uuid';
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  ScanCommandInput,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { eventCreatedEmailTemplate } from '../emails/templates/events/event-created-email.template';
import { PatchEventDto } from './dto/patch-events.dto';
import { Status } from '../common/enum/status.enum';
import { UserService } from '../users/users.service';
import { eventDeletedEmailTemplate } from '../emails/templates/events/event-deleted-email.template';
import { Role } from '../common/enum/roles.enum';
import { EventPaginationQueryDto } from './dto/event-pagination-query.dto';

@Injectable()
export class EventService {
  private readonly tableName = process.env.DYNAMODB_TABLE_EVENTS || 'events';

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly sesMailService: SESMailService,
    private readonly userService: UserService,
  ) {}

  async create(data: CreateEventDto, organizer: any, imageUrl: string) {
    try {
      if (await this.nameExists(data.name)) {
        throw new ConflictException('event name already exists');
      }

      if (!organizer.id) {
        throw new BadRequestException('organizerId is required');
      }

      const event = {
        id: uuid(),
        organizerId: organizer.id,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: imageUrl,
        deletedAt: null,
        status: Status.ACTIVE,
      };

      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: event,
        }),
      );

      await this.sesMailService.sendEmail(
        organizer.email,
        `🎉  Event Created Successfully: ${event.name}`,
        eventCreatedEmailTemplate(
          organizer.name,
          event.name,
          new Date(event.date).toISOString(),
          event.description,
          imageUrl,
        ),
      );

      return event;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    query: EventPaginationQueryDto,
  ): Promise<{ count: number; data: any[]; lastKey?: string; page: number }> {
    const { limit = 10, lastKey, name, date, status, page = 1 } = query;

    const params: ScanCommandInput = {
      TableName: this.tableName,
      Limit: Number(limit),
    };

    if (lastKey) {
      try {
        params.ExclusiveStartKey = JSON.parse(lastKey);
      } catch (error) {
        throw new BadRequestException('Invalid lastKey.');
      }
    }

    const filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (name) {
      filterExpressions.push('contains(#name, :nameVal)');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':nameVal'] = name;
    }

    if (date) {
      filterExpressions.push('#date <= :dateVal');
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':dateVal'] = date;
    }

    if (status) {
      filterExpressions.push('#status = :statusVal');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':statusVal'] = status;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
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

  async findById(eventId: string) {
    try {
      const event = await this.dynamoDBService.client.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            id: eventId,
          },
        }),
      );
      if (!event.Item) {
        throw new BadRequestException('event not found');
      }
      return event.Item;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(
    eventId: string,
    data: PatchEventDto,
    userId: string,
    userRole: string,
  ) {
    try {
      if (!data) {
        throw new BadRequestException('data is required');
      }

      const event = await this.validateEvent(eventId);

      if (userId !== event.organizerId && userRole !== Role.ADMIN) {
        throw new ForbiddenException('you can only update your own events');
      }

      if (data.name && data.name !== event.name) {
        if (await this.nameExists(data.name)) {
          throw new ConflictException('event name already exists');
        }
      }

      const updatedEvent = {
        ...event,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: updatedEvent,
        }),
      );

      return updatedEvent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async softDelete(eventId: string, userId: string, userRole: string) {
    try {
      const event = await this.validateEvent(eventId);

      if (userId !== event.organizerId && userRole !== Role.ADMIN) {
        throw new ForbiddenException('you can only delete your own events');
      }

      const updatedEvent = {
        ...event,
        deletedAt: new Date().toISOString(),
        status: Status.INACTIVE,
      };

      const organizer = await this.userService.findById(event.organizerId);

      await this.dynamoDBService.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: updatedEvent,
        }),
      );

      await this.sesMailService.sendEmail(
        organizer.email,
        `Your event has been canceled: ${event.name}`,
        eventDeletedEmailTemplate(
          organizer.name,
          event.name,
          new Date(event.date).toISOString(),
          event.description,
          event.imageUrl,
        ),
      );

      return updatedEvent;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async nameExists(name: string) {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': name,
        },
      });

      const result = await this.dynamoDBService.client.send(command);

      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateEvent(eventId: string) {
    const event = await this.findById(eventId);
    if (!event) {
      throw new BadRequestException('event not found');
    }
    if (event.status === Status.INACTIVE) {
      throw new ConflictException('event is inactive');
    }
    return event;
  }
}
