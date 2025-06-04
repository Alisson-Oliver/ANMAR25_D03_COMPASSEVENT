import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class SubscriptionPaginationQueryDto {
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
      'The last key from the previous page result (for DynamoDB pagination). JSON stringify the object.',
    example: '',
    type: String,
  })
  @IsOptional()
  @IsString()
  lastKey?: string;

  @ApiPropertyOptional({
    description:
      'Page number (informational, actual pagination relies on lastKey)',
    example: 1,
    type: Number,
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: number;
}
