import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Subscription } from 'rxjs';
import { PerformanceMetrics } from '../../core/models/domain.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, KpiCardComponent],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  stats: PerformanceMetrics = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    netProfit: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0
  };
  isLoading = true;

  // Chart configs required by template
  public pieOptions: any = {
    series: [0, 0],
    chart: { type: 'donut', height: 300 },
    labels: ['Wins', 'Losses'],
    colors: ['#00C853', '#FF1744'],
    plotOptions: { pie: { donut: { size: '70%' } } },
    legend: { position: 'bottom', labels: { colors: '#fff' } }
  };

  public histOptions: any = {
    series: [{ name: 'Trades', data: [] }],
    chart: { type: 'bar', height: 300 },
    xaxis: { categories: [], labels: { style: { colors: '#fff' } } },
    colors: ['#2196F3']
  };

  private sub = new Subscription();

  constructor(private analyticsSvc: AnalyticsService) {}

  ngOnInit() {
    this.sub.add(
      this.analyticsSvc.getMetrics().subscribe(data => {
        this.stats = data || this.stats;
        this.isLoading = false;
        this.pieOptions.series = [this.stats.winningTrades || 0, this.stats.losingTrades || 0];
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
