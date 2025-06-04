import {
  IsOptional,
  IsString,
  IsNumberString,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Role } from '../../common/enum/roles.enum';

export class PaginationQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsString()
  lastKey?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn([Role.ORGANIZER, Role.PARTICIPANT])
  role?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}
