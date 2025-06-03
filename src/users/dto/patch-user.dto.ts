import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class PatchUserDto extends OmitType(PartialType(CreateUserDto), [
  'role',
] as const) {}
