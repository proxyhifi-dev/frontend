import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentFormat',
  standalone: true
})
export class PercentFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals: number = 2, showSign = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }

    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${formatted}%`;
  }
}
