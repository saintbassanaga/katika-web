import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phoneMask', standalone: true })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    // Remove +237 prefix if present
    const digits = value.replace(/^\+237/, '').replace(/\D/g, '');
    if (digits.length < 9) return value;
    // Mask middle digits: 6XX XXX XXX
    return `+237 ${digits[0]}XX XXX ${digits.slice(6)}`;
  }
}
