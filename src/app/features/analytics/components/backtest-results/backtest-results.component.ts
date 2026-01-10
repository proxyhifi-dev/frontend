import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../../../shared/pipes/percent-format.pipe';
import { BacktestDetail } from '../../../../core/services/backtest.service';

@Component({
  selector: 'app-backtest-results',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './backtest-results.component.html'
})
export class BacktestResultsComponent {
  @Input() results: BacktestDetail | null = null;
  @Input() backtestChartData: ApexOptions = {
    series: [],
    chart: { type: 'line', height: 300 },
    xaxis: { categories: [] }
  };
}
