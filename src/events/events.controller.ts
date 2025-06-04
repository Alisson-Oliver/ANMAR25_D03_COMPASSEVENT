import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../storages/aws-s3.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { PatchEventDto } from './dto/patch-events.dto';
import { ValidationImagePipe } from '../common/pipes/validation-image.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { EventPaginationQueryDto } from './dto/event-pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Status } from '../common/enum/status.enum';

@ApiTags('Events')
@Controller('/events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event (Admin, Organizer)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Event data and image file.',
    schema: {
      type: 'object',
      required: ['image', 'name', 'description', 'date'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Event image file (e.g., JPEG, PNG). Max 15MB.',
        },
        name: { type: 'string', example: 'Summer Music Festival' },
        description: {
          type: 'string',
          example: 'An amazing outdoor music festival.',
        },
        date: {
          type: 'string',
          format: 'date-time',
          example: '2025-07-20T14:00',
          description: 'In ISO format with time (YYYY-MM-DDTHH:MM)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request (e.g., validation error, name exists, invalid date).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Insufficient role).' })
  @ApiResponse({
    status: 409,
    description: 'Conflict (Event name already exists).',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error (e.g. S3_BUCKET_NAME not defined)',
  })
  async create(
    @UploadedFile(new ValidationImagePipe()) image: Express.Multer.File,
    @Req() req,
    @Body() data: CreateEventDto,
  ) {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }
    const imageUrl = await this.s3Service.uploadImage(
      image,
      bucketName,
      process.env.S3_EVENTS_FOLDER || 'events',
    );
    return await this.eventService.create(data, req.user, imageUrl);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Find all events with pagination and filters (All authenticated users)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default 10)',
  })
  @ApiQuery({
    name: 'lastKey',
    required: false,
    type: String,
    description: 'Last key for DynamoDB pagination',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by event name (contains)',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description:
      'Filter by event date (events on or before this date, YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: Status,
    description: 'Filter by event status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (alternative to lastKey, default 1)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid lastKey).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async findAll(@Query() query: EventPaginationQueryDto) {
    return await this.eventService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find an event by ID (All authenticated users)' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the event to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event details retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid UUID).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  async findById(@Req() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return await this.eventService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update an event (Admin, Organizer)' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the event to update',
    type: String,
  })
  @ApiBody({ type: PatchEventDto })
  @ApiResponse({ status: 204, description: 'Event updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., validation error, no data provided).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (User cannot update this event).',
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict (Event name already exists or event is inactive).',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: PatchEventDto,
    @Req() req,
  ) {
    await this.eventService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an event (Admin, Organizer)' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the event to soft delete',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Event soft deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (User cannot delete this event).',
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 409, description: 'Conflict (Event is inactive).' })
  async softDelete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    await this.eventService.softDelete(id, req.user.id, req.user.role);
  }
}
