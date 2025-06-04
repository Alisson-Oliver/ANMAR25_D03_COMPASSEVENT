import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { RoleGuard } from '../common/guards/role.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionPaginationQueryDto } from './dto/subscription-pagination-query.dto';

@ApiTags('Subscriptions')
@Controller('/subscriptions')
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({
    summary:
      'Find all subscriptions for the currently authenticated user (paginated)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'lastKey',
    required: false,
    type: String,
    description: 'Last key for pagination (JSON string)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (informational)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of subscriptions retrieved successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAllById(
    @Req() req,
    @Query() query: SubscriptionPaginationQueryDto,
  ) {
    return await this.subscriptionService.findAllById(req.user.id, query);
  }

  @Post()
  @Roles(Role.PARTICIPANT, Role.ORGANIZER)
  @UseGuards(AuthGuard, RoleGuard)
  @ApiOperation({
    summary: 'Create a new subscription to an event (Participant, Organizer)',
  })
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully. Confirmation email sent.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., already subscribed).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden (e.g., user inactive/unverified, event inactive/past, user role not allowed to subscribe).',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found (User or Event not found).',
  })
  async create(@Body() data: CreateSubscriptionDto) {
    return await this.subscriptionService.create(data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Soft delete a subscription (Participant who owns it, or Admin/Organizer of the event)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'UUID of the subscription to delete',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Subscription soft deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., subscription already deleted/inactive).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (User cannot delete this subscription).',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found.' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    await this.subscriptionService.softDelete(id, req.user.id);
  }
}
