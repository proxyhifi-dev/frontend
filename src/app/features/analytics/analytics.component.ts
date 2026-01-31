import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexXAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Subscription } from 'rxjs';
import { PerformanceMetrics } from '../../core/models/domain.model';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, KpiCardComponent, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  stats: PerformanceMetrics | null = null;
  isLoading = true;
  activeRange: '30d' | '90d' | 'all' = '30d';
  errorMessage = '';
  readonly emptyStates = EMPTY_STATE_MESSAGES;

  // Strongly-typed chart configs so Angular template type-checking doesn't
  // complain about possibly-undefined ApexOptions fields.
  public pieOptions: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    plotOptions: ApexPlotOptions;
    legend: ApexLegend;
  } = {
    series: [],
    chart: { type: 'donut', height: 300 },
    labels: ['Wins', 'Losses'],
    colors: ['#00C853', '#FF1744'],
    plotOptions: { pie: { donut: { size: '70%' } } },
    legend: { position: 'bottom', labels: { colors: '#fff' } }
  };

  public histOptions: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    colors: string[];
  } = {
    series: [{ name: 'Trades', data: [] }],
    chart: { type: 'bar', height: 300 },
    xaxis: { categories: [], labels: { style: { colors: '#fff' } } },
    colors: ['#2196F3']
  };

  private sub = new Subscription();

  constructor(private analyticsSvc: AnalyticsService) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.isLoading = true;
    this.errorMessage = '';
    this.sub.add(
      this.analyticsSvc.getMetrics(this.activeRange).subscribe({
        next: (data) => {
          this.stats = data ?? null;
          if (this.stats) {
            this.pieOptions.series = [this.stats.winningTrades || 0, this.stats.losingTrades || 0];
          } else {
            this.pieOptions.series = [];
            this.histOptions.series = [{ name: 'Trades', data: [] }];
            this.histOptions.xaxis = { categories: [] };
          }
          this.isLoading = false;
        },
        error: () => {
          this.stats = null;
          this.pieOptions.series = [];
          this.histOptions.series = [{ name: 'Trades', data: [] }];
          this.histOptions.xaxis = { categories: [] };
          this.errorMessage = 'Unable to load analytics.';
          this.isLoading = false;
        }
      })
    );
  }

  setRange(range: '30d' | '90d' | 'all') {
    if (this.activeRange === range) return;
    this.activeRange = range;
    this.loadMetrics();
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
