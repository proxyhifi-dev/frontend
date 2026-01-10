import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyInrPipe } from '../../pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../pipes/percent-format.pipe';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './kpi-card.html'
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() percentChange: number = 0;
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() format: 'currency' | 'percent' | 'number' = 'number';
  @Input() isPositive: boolean = true;
}
