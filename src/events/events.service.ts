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
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { eventCreatedEmailTemplate } from '../emails/templates/events/event-created-email.template';
import { PatchEventDto } from './dto/patch-events.dto';
import { Status } from '../common/enum/status.enum';
import { UserService } from '../users/users.service';
import { eventDeletedEmailTemplate } from '../emails/templates/events/event-deleted-email.template';
import { Role } from '../common/enum/roles.enum';

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

  async findAll() {
    try {
      const events = await this.dynamoDBService.client.send(
        new ScanCommand({
          TableName: this.tableName,
        }),
      );

      return { count: events.Count, data: events.Items };
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
