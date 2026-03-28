import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'amount', standalone: true })
export class AmountPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currency = 'XAF'): string {
    if (value == null || value === '') return `0 ${currency}`;
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numeric)) return `0 ${currency}`;
    try {
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numeric);
      return `${formatted} ${currency}`;
    } catch {
      return `${numeric} ${currency}`;
    }
  }
}
