import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexPlotOptions,
  ApexTooltip
} from 'ng-apexcharts';

interface CorrelationRow {
  pair: string;
  correlation: number;
  regime: string;
}

@Component({
  selector: 'app-risk-correlation',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './risk-correlation.component.html',
  styleUrls: ['./risk-correlation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskCorrelationComponent {
  portfolioHeat = 62;
  correlationRegime = 'Moderate';
  loading = false;

  heatGaugeOptions: {
    series: number[];
    chart: ApexChart;
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    labels: string[];
    colors: string[];
  } = {
    series: [this.portfolioHeat],
    chart: {
      type: 'radialBar',
      height: 280
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '60%'
        },
        dataLabels: {
          name: {
            fontSize: '12px'
          },
          value: {
            fontSize: '20px'
          }
        }
      }
    },
    dataLabels: {
      enabled: true
    },
    labels: ['Heat'],
    colors: ['#F59E0B']
  };

  exposureOptions: {
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
        name: 'Exposure %',
        data: [28, 22, 18, 14, 10]
      }
    ],
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['IT', 'Banking', 'Energy', 'Auto', 'FMCG']
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}%`
      }
    },
    colors: ['#22C55E']
  };

  correlations: CorrelationRow[] = [
    { pair: 'NIFTY-IT vs BANKNIFTY', correlation: 0.42, regime: 'Moderate' },
    { pair: 'RELIANCE vs ONGC', correlation: 0.67, regime: 'High' },
    { pair: 'TCS vs INFY', correlation: 0.78, regime: 'High' },
    { pair: 'HDFCBANK vs ICICIBANK', correlation: 0.71, regime: 'High' },
    { pair: 'HINDUNILVR vs ITC', correlation: 0.38, regime: 'Low' }
  ];
}
