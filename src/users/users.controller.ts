import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { PaginationQueryDto } from './dto/user-pagination-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new user (Public)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User data and avatar image.',
    schema: {
      type: 'object',
      required: ['image', 'name', 'email', 'password', 'phone', 'role'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'User avatar image (e.g., JPEG, PNG). Max 15MB.',
        },
        name: { type: 'string', example: 'Jane Doe' },
        email: { type: 'string', example: 'jane.doe@example.com' },
        password: { type: 'string', example: 'SecureP@ss1' },
        phone: { type: 'string', example: '+55 (21) 91234-5678' },
        role: {
          type: 'string',
          enum: [Role.ORGANIZER, Role.PARTICIPANT],
          example: Role.PARTICIPANT,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully. Verification email sent.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., validation error).',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (Email or phone already exists).',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error (e.g. S3_BUCKET_NAME not defined)',
  })
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
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary:
      'Find a user by ID (Authenticated users, can only view own profile unless Admin)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the user to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid UUID).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Cannot view other users profile).',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    if (req.user.role !== Role.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only view your own profile.');
    }
    return await this.userService.findById(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Find all users (Admin only)' })
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
    description: 'Filter by user name (contains)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by user email (contains)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: [Role.ORGANIZER, Role.PARTICIPANT],
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid lastKey).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async findAll(@Query() query: PaginationQueryDto) {
    return await this.userService.findAll(query);
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update a user profile (Authenticated users, can only update own profile unless Admin)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the user to update',
    type: String,
  })
  @ApiBody({ type: PatchUserDto })
  @ApiResponse({ status: 204, description: 'User updated successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., validation error, no data provided).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Cannot update other users profile).',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict (Email or phone already exists, or user inactive/unverified).',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new FormatPhonePipe()) data: PatchUserDto,
    @Req() req,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException('You can only update your own profile.');
    }

    await this.userService.update(id, data);
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Soft delete a user account (Authenticated users can delete own, Admin can delete any)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the user to soft delete',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'User soft deleted successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Cannot delete other users profile unless Admin).',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict (User inactive/unverified).',
  })
  async softDelete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    if (req.user.id !== id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You can only delete your own profile unless you are an admin.',
      );
    }
    await this.userService.softDelete(id);
  }
}
