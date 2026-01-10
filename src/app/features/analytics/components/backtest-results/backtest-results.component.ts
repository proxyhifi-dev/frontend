import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../../../shared/pipes/percent-format.pipe';

@Component({
  selector: 'app-backtest-results',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './backtest-results.component.html'
})
export class BacktestResultsComponent {
  @Input() results: any;
  @Input() backtestChartData: any = {
    series: [],
    chart: { type: 'line', height: 300 },
    xaxis: { categories: [] }
  };
}
