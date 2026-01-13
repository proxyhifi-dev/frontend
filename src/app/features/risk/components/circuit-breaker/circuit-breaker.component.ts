import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApexChart, ApexPlotOptions, NgApexchartsModule } from 'ng-apexcharts';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-circuit-breaker',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, CurrencyInrPipe],
  template: `
    <div class="glass-card risk-card">
      <h3>Daily Risk Limit</h3>
      <apx-chart
        [series]="[percentUsed]"
        [chart]="chartOptions.chart"
        [plotOptions]="chartOptions.plotOptions"
        [labels]="['Limit Used']"
        [colors]="[getGaugeColor()]">
      </apx-chart>
      <div class="risk-stats">
        <span>Used: {{ currentLoss | currencyInr }}</span>
        <span>Limit: {{ dailyLimit | currencyInr }}</span>
      </div>
    </div>
  `,
  styles: [`
    .risk-card { padding: 20px; text-align: center; }
    .risk-stats { display: flex; justify-content: space-between; margin-top: -30px; font-size: 12px; color: var(--text-secondary); }
  `]
})
export class CircuitBreakerComponent {
  @Input() currentLoss: number = 0; // ✅ Added Input
  @Input() dailyLimit: number = 5000; // ✅ Added Input

  get percentUsed() {
    if (this.dailyLimit === 0) return 0;
    return Math.min((Math.abs(this.currentLoss) / this.dailyLimit) * 100, 100);
  }

  getGaugeColor() {
    if (this.percentUsed > 80) return '#FF1744';
    if (this.percentUsed > 50) return '#FF9800';
    return '#00C853';
  }

  public chartOptions: { chart: ApexChart; plotOptions: ApexPlotOptions } = {
    chart: { type: 'radialBar', height: 250, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        track: { background: "#1E2339", strokeWidth: '97%' },
        dataLabels: { name: { show: false }, value: { offsetY: -2, fontSize: '22px', color: '#fff' } }
      }
    }
  };
}
