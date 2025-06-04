import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RoleGuard } from '../common/guards/role.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';

@Controller('/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  async findAllById(@Req() req) {
    return await this.subscriptionService.findAllById(req.user.id);
  }

  @Post()
  @Roles(Role.PARTICIPANT, Role.ORGANIZER)
  @UseGuards(AuthGuard, RoleGuard)
  async create(@Body() data: CreateSubscriptionDto) {
    return await this.subscriptionService.create(data);
  }
}
