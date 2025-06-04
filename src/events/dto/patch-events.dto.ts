import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PatchEventDto extends PartialType(CreateEventDto) {
  @ApiPropertyOptional({
    description: 'Organizer ID (UUID), if changing the organizer',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    minLength: 36,
    maxLength: 36,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(36)
  organizerId?: string;
}
