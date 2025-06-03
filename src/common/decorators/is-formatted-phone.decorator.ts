import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export function IsFormattedPhoneNumber() {
  return applyDecorators(
    IsNotEmpty(),
    IsString(),
    IsPhoneNumber('BR', {
      message: 'phone must be a valid phone number.',
    }),
  );
}
