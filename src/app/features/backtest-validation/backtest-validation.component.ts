import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexTooltip } from 'ng-apexcharts';
import { ToastService } from '../../core/services/toast.service';

interface MetricCard {
  label: string;
  value: string;
  trend: string;
}

@Component({
  selector: 'app-backtest-validation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgApexchartsModule],
  templateUrl: './backtest-validation.component.html',
  styleUrls: ['./backtest-validation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BacktestValidationComponent {
  private fb = inject(FormBuilder);
  readonly form = this.fb.group({
    universe: ['NIFTY 50'],
    startDate: ['2023-01-01'],
    endDate: ['2024-01-01'],
    timeframe: ['15m'],
    costModel: ['0.08%'],
    slippage: ['0.02%']
  });

  loading = false;
  errorMessage: string | null = null;

  metrics: MetricCard[] = [
    { label: 'Sharpe', value: '1.42', trend: '+0.12' },
    { label: 'Deflated Sharpe', value: '1.18', trend: '+0.08' },
    { label: 'Profit Factor', value: '1.74', trend: '+0.21' },
    { label: 'Max Drawdown', value: '-8.6%', trend: '-0.4%' },
    { label: 'CVaR 95%', value: '-3.1%', trend: '+0.3%' },
    { label: 'RoR', value: '18.4%', trend: '+1.2%' }
  ];

  chartOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    tooltip: ApexTooltip;
    colors: string[];
  } = {
    series: [
      {
        name: 'Runs',
        data: [12, 18, 22, 28, 19, 14, 9]
      }
    ],
    chart: {
      type: 'bar',
      height: 260,
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['-10%', '-5%', '0%', '5%', '10%', '15%', '20%']
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['transparent']
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} runs`
      }
    },
    colors: ['#38BDF8']
  };

  constructor(private toastService: ToastService) {}

  runBacktest(): void {
    this.executeJob('Backtest');
  }

  runValidation(): void {
    this.executeJob('Validation');
  }

  private executeJob(label: string): void {
    this.errorMessage = null;
    this.loading = true;
    this.toastService.showInfo(`${label} queued with current parameters.`);
    setTimeout(() => {
      this.loading = false;
    }, 400);
  }
}
