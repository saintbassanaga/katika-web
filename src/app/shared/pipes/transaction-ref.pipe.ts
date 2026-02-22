import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'transactionRef', standalone: true })
export class TransactionRefPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (!value) return '';
    const str = value.toString();
    // If already formatted
    if (str.startsWith('KT-')) return str;
    // Format numeric id
    const year = new Date().getFullYear();
    return `KT-${year}-${str.padStart(6, '0')}`;
  }
}
