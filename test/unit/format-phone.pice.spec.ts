import { ArgumentMetadata } from '@nestjs/common';
import { FormatPhonePipe } from '../../src/common/pipes/format-phone.pipe';

describe('FormatPhonePipe', () => {
  let pipe: FormatPhonePipe;

  beforeEach(() => {
    pipe = new FormatPhonePipe();
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: Object,
    data: '',
  };

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should format a 10-digit phone number correctly', () => {
    const value = { phone: '1198765432' };
    const valueWith10Digits = { phone: '1187654321' };
    const expected = { phone: '+55 (11) 8765-4321' };
    expect(pipe.transform(valueWith10Digits, metadata)).toEqual(expected);
  });

  it('should format an 11-digit phone number correctly (with 9th digit)', () => {
    const value = { phone: '11987654321' };
    const expected = { phone: '+55 (11) 98765-4321' };
    expect(pipe.transform(value, metadata)).toEqual(expected);
  });

  it('should format phone with non-digit characters', () => {
    const value = { phone: '(11) 98765-4321' };
    const expected = { phone: '+55 (11) 98765-4321' };
    expect(pipe.transform(value, metadata)).toEqual(expected);
  });

  it('should return value as is if phone property is missing', () => {
    const value = { name: 'Test' };
    expect(pipe.transform(value, metadata)).toEqual(value);
  });

  it('should return value as is if phone is null', () => {
    const value = { phone: null };
    expect(pipe.transform(value, metadata)).toEqual(value);
  });

  it('should return value as is if phone is an empty string', () => {
    const value = { phone: '' };
    expect(pipe.transform(value, metadata)).toEqual(value);
  });

  it('should return value as is if phone number has less than 10 digits', () => {
    const value = { phone: '1112345' };
    expect(pipe.transform(value, metadata)).toEqual(value);
  });

  it('should handle other properties in the object', () => {
    const value = {
      name: 'Tester',
      phone: '21999998888',
      email: 'test@example.com',
    };
    const expected = {
      name: 'Tester',
      phone: '+55 (21) 99999-8888',
      email: 'test@example.com',
    };
    expect(pipe.transform(value, metadata)).toEqual(expected);
  });
});
