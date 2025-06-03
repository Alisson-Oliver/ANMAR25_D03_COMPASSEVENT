import { IsStrongPassword } from 'class-validator';
import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';

export class AuthLoginDto {
  @IsCustomEmail()
  email: string;

  @IsStrongPassword({
    minLength: 8,
  })
  password: string;
}
