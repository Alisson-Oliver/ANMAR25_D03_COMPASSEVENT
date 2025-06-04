import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export function IsCustomEmail() {
  return applyDecorators(
    IsEmail(),
    IsNotEmpty(),
    Length(5, 150),
    Transform(({ value }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
  );
}
