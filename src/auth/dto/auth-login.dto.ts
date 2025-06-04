import { IsString } from 'class-validator';
import { IsCustomEmail } from '../../common/decorators/is-custom-email.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsCustomEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'User password (must meet complexity requirements)',
  })
  @IsString()
  password: string;
}
