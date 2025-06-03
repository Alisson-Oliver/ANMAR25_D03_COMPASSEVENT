import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsPersonName } from '../../common/decorators/is-person-name.decorator';
import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';
import { Role } from '../../common/enum/roles.enum';

export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsPersonName()
  name?: string;

  @IsOptional()
  @IsCustomEmail()
  email?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsOptional()
  @IsString()
  lastKey?: string;
}
