import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'Tech Conference 2025',
    description: 'Name of the event',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    example: 'A conference about the latest in technology.',
    description: 'Detailed description of the event',
    minLength: 10,
    maxLength: 250,
  })
  @IsString()
  @Length(10, 250)
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: '2025-09-15T09:00',
    description: 'Date and time of the event in ISO format (YYYY-MM-DDTHH:MM)',
    pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$',
  })
  @IsDateString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
    message: 'date must be in ISO format with time (Ex: 2025-06-03T19:30)',
  })
  date: Date;
}
