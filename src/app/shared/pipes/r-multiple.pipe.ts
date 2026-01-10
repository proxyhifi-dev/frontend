import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rMultiple',
  standalone: true
})
export class RMultiplePipe implements PipeTransform {
  transform(value: number | null | undefined, decimals: number = 2, showSign = true): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }

    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${formatted}R`;
  }
}
