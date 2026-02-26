import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'XAF'): string {
    if (value == null) return '0 XAF';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
