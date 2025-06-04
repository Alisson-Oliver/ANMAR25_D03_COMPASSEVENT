import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { Role } from '../../common/enum/roles.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
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
    description: 'Filter by user name (case-sensitive, partial match)',
    example: 'John',
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by user email (case-sensitive, partial match)',
    example: 'john.doe@example.com',
    type: String,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: [Role.ORGANIZER, Role.PARTICIPANT],
    example: Role.PARTICIPANT,
  })
  @IsOptional()
  @IsString()
  @IsIn([Role.ORGANIZER, Role.PARTICIPANT])
  role?: string;

  @ApiPropertyOptional({
    description:
      'Page number for pagination (alternative to lastKey if not using DynamoDB lastKey)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: number;
}
