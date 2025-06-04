import { IsOptional, IsString, IsNumberString, IsEnum } from 'class-validator';
import { Status } from '../../common/enum/status.enum';

export class EventPaginationQueryDto {
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
  date?: string;

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsNumberString()
  page?: number;
}
