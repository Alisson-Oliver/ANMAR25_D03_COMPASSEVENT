import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FormatPhonePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || !value.phone) return value;

    const digits = value.phone.replace(/\D/g, '');

    if (digits.length < 10) return value;

    const ddi = '+55';
    const ddd = digits.slice(0, 2);
    const main = digits.slice(2);

    const prefix = main.length === 9 ? main.slice(0, 5) : main.slice(0, 4);
    const suffix = main.length === 9 ? main.slice(5) : main.slice(4);

    return {
      ...value,
      phone: `${ddi} (${ddd}) ${prefix}-${suffix}`,
    };
  }
}
