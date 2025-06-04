import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';
import { IsCustomPassword } from '../../common/decorators/is-custom-password.decorator';
import { IsFormattedPhoneNumber } from '../../common/decorators/is-formatted-phone.decorator';
import { isCustomUserRole } from '../../common/decorators/is-custom-user-role.decorator';
import { IsPersonName } from '../../common/decorators/is-person-name.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enum/roles.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsPersonName()
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsCustomEmail()
  email: string;

  @ApiProperty({
    example: 'P@sswOrd123',
    description:
      'Password for the user account (8-20 chars, letters & numbers, no spaces)',
  })
  @IsCustomPassword()
  password: string;

  @ApiProperty({
    example: '+55 (11) 98765-4321',
    description: 'Phone number of the user (Brazilian format)',
  })
  @IsFormattedPhoneNumber()
  phone: string;

  @ApiProperty({
    example: Role.PARTICIPANT,
    description: 'Role of the user',
    enum: [Role.ORGANIZER, Role.PARTICIPANT],
  })
  @isCustomUserRole()
  role: string;
}
