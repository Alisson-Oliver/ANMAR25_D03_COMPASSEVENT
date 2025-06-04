import { IsOptional, IsString, IsNumberString, IsEnum } from 'class-validator';
import { Status } from '../../common/enum/status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    type: Number,
    default: 10,
  })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({
    description:
      'The last key from the previous page result (for DynamoDB pagination)',
    example: '',
    type: String,
  })
  @IsOptional()
  @IsString()
  lastKey?: string;

  @ApiPropertyOptional({
    description: 'Filter by event name (case-sensitive, partial match)',
    example: 'Conference',
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by event date (events on or before this date)',
    example: '2025-12-31',
    type: String,
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by event status',
    enum: Status,
    example: Status.ACTIVE,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    description: 'Page number for pagination (alternative to lastKey)',
    example: 1,
    type: Number,
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: number;
}
