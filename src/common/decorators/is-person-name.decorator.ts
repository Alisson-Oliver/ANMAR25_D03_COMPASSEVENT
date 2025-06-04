import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export function IsPersonName() {
  return applyDecorators(
    IsNotEmpty(),
    IsString(),
    Length(2, 100),
    Transform(({ value }) => {
      if (typeof value === 'string') {
        return value.replace(/\s+/g, ' ').trim();
      }
      return value;
    }),
    Matches(/^[A-Za-zÀ-ÿ\s.'-]+$/, {
      message:
        'name must contain only letters, spaces, dots, apostrophes, or hyphens.',
    }),
  );
}
