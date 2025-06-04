import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class PatchEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(36)
  organizarId?: string;
}
