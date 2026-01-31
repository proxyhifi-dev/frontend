import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
import { RiskService } from '../../core/services/risk.service';
import { CorrelationMatrix } from '../../core/models/domain.model';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

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
  portfolioHeat = 0;
  correlationRegime = 'Unknown';
  loading = false;
  correlations: CorrelationRow[] = [];
  readonly emptyStates = EMPTY_STATE_MESSAGES;

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
    series: [{ name: 'Correlation %', data: [] }],
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false }
    },
    xaxis: {
      categories: []
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

  constructor(private riskService: RiskService) {}

  ngOnInit(): void {
    this.loading = true;
    this.riskService.getCorrelationMatrix().subscribe({
      next: (matrix) => {
        this.updateFromMatrix(matrix);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private updateFromMatrix(matrix: CorrelationMatrix): void {
    const { symbols, matrix: values } = matrix;
    if (!symbols?.length || !values?.length) {
      this.portfolioHeat = 0;
      this.correlationRegime = 'Unknown';
      this.correlations = [];
      return;
    }

    const pairs: CorrelationRow[] = [];
    const symbolAverages: Record<string, number> = {};

    symbols.forEach((symbol, i) => {
      const row = values[i] ?? [];
      const avg = row.reduce((sum, val) => sum + Math.abs(val ?? 0), 0) / Math.max(row.length, 1);
      symbolAverages[symbol] = Math.round(avg * 100);
      row.forEach((value, j) => {
        if (j <= i) return;
        const correlation = value ?? 0;
        pairs.push({
          pair: `${symbols[i]} vs ${symbols[j]}`,
          correlation,
          regime: this.getRegimeLabel(correlation)
        });
      });
    });

    const avgCorrelation =
      pairs.reduce((sum, item) => sum + Math.abs(item.correlation), 0) / Math.max(pairs.length, 1);
    this.portfolioHeat = Math.round(avgCorrelation * 100);
    this.correlationRegime = this.getRegimeLabel(avgCorrelation);
    this.correlations = pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 5);

    const topSymbols = Object.entries(symbolAverages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    this.exposureOptions = {
      ...this.exposureOptions,
      series: [{ name: 'Correlation %', data: topSymbols.map(([, value]) => value) }],
      xaxis: { categories: topSymbols.map(([symbol]) => symbol) }
    };

    this.heatGaugeOptions = {
      ...this.heatGaugeOptions,
      series: [this.portfolioHeat]
    };
  }

  private getRegimeLabel(correlation: number): string {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'High';
    if (abs >= 0.4) return 'Moderate';
    return 'Low';
  }
}
