import { applyDecorators } from '@nestjs/common';
import { Role } from '../enum/roles.enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export function isCustomUserRole() {
  return applyDecorators(
    IsEnum([Role.ORGANIZER, Role.PARTICIPANT], {
      message: 'role must be organizer or participant',
    }),
    IsNotEmpty(),
  );
}
