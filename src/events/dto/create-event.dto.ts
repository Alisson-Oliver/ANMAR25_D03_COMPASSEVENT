import {
  IsDateString,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @Length(10, 250)
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
    message: 'date must be in ISO format with time (Ex: 2025-06-03T19:30:00Z)',
  })
  date: Date;
}
