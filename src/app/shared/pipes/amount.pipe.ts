import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currency = 'XAF'): string {
    if (value == null || value === '') return '— XAF';
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numeric)) return '— XAF';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  }
}
