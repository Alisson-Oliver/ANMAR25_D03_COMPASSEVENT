import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  event_id: string;
}
