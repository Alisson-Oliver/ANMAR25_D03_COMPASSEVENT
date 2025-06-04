import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscriptions.service';
import { RoleGuard } from '../common/guards/role.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enum/roles.enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

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

  @Delete(':id')
  @Roles(Role.ORGANIZER, Role.PARTICIPANT)
  @UseGuards(AuthGuard, RoleGuard)
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string, @Req() req) {
    await this.subscriptionService.softDelete(id, req.user.id);
  }
}
