import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { AnalyticsService } from '../../core/services/analytics.service';
import { StoreService } from '../../core/services/store.service';
import { Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, KpiCardComponent],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  stats: any = { winRate: 0, profitFactor: 0, totalTrades: 0, avgR: 0 };
  isLoading = true;

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

  constructor(private analyticsSvc: AnalyticsService, private store: StoreService) {}

  ngOnInit() {
    this.sub.add(
      this.store.state$.pipe(
        switchMap(() => {
          this.isLoading = true;
          return this.analyticsSvc.getOverview();
        })
      ).subscribe(data => {
        this.stats = data || this.stats;
        this.isLoading = false;
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
