import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';
import { IsCustomPassword } from '../../common/decorators/is-custom-password.decorator';
import { IsFormattedPhoneNumber } from '../../common/decorators/is-formatted-phone.decorator';
import { isCustomUserRole } from '../../common/decorators/is-custom-user-role.decorator';
import { IsPersonName } from '../../common/decorators/is-person-name.decorator';

export class CreateUserDto {
  @IsPersonName()
  name: string;

  @IsCustomEmail()
  email: string;

  @IsCustomPassword()
  password: string;

  @IsFormattedPhoneNumber()
  phone: string;

  @isCustomUserRole()
  role: string;
}
