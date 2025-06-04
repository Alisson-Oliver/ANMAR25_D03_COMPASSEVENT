import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../storages/aws-s3.service';
import { FormatPhonePipe } from '../common/pipes/format-phone.pipe';
import { PatchUserDto } from './dto/patch-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { AuthGuard } from '../common/guards/auth.guard';
import { RoleGuard } from '../common/guards/role.guard';
import { ValidationImagePipe } from '../common/pipes/validation-image.pipe';

@Controller('/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile(new ValidationImagePipe()) image: Express.Multer.File,
    @Body(new FormatPhonePipe()) data: CreateUserDto,
  ) {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }
    const imageUrl = await this.s3Service.uploadImage(
      image,
      bucketName,
      process.env.S3_USERS_FOLDER || 'users',
    );
    return await this.userService.create(data, imageUrl);
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    if (req.user.id !== id) {
      throw new ForbiddenException('you can only view your own profile');
    }
    return await this.userService.findById(id);
  }
}
