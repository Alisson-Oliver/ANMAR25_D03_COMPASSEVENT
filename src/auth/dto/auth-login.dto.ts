import { IsString, IsStrongPassword } from 'class-validator';
import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';

export class AuthLoginDto {
  @IsCustomEmail()
  email: string;

  @IsString()
  password: string;
}
