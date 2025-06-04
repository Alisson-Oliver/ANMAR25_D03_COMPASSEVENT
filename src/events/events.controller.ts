import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EventService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileURLToPath } from 'url';
import { S3Service } from '../storages/aws-s3.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { PatchEventDto } from './dto/patch-events.dto';
import { ValidationImagePipe } from '../common/pipes/validation-image.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

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
  async findAll() {
    return await this.eventService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  async findById(@Req() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return await this.eventService.findById(id);
  }
}
