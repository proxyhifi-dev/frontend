import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrelationHeatmapComponent } from './components/correlation-heatmap.component';
import { RiskService } from '../../core/services/risk.service';
import { StoreService } from '../../core/services/store.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { RiskStatus } from '../../core/models/domain.model';

@Component({
  selector: 'app-risk',
  standalone: true,
 imports: [CommonModule, CurrencyInrPipe],
 templateUrl: './risk.component.html',
 styleUrls: ['./risk.component.scss']})
export class RiskComponent implements OnInit {
  riskStatus: RiskStatus = {
    dailyLoss: 0,
    dailyLimit: 5000,
    weeklyLoss: 0,
    weeklyLimit: 10000,
    monthlyPnl: 0,
    consecutiveLosses: 0,
    cbActive: false
  };

  exposure = {
    total: 100000,
    used: 68500,
    sectors: [
      { name: 'IT', count: 2, limit: 2, status: 'FULL' },
      { name: 'Energy', count: 1, limit: 2, status: 'SAFE' },
      { name: 'Banking', count: 0, limit: 2, status: 'SAFE' }
    ]
  };

  constructor(
    private riskSvc: RiskService,
    private store: StoreService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadRiskData();
  }

  loadRiskData() {
    this.riskSvc.getCircuitBreakerStatus().subscribe((data: RiskStatus) => this.riskStatus = data);
  }

  emergencyStop() {
    const confirmStop = prompt('Type "STOP" to confirm emergency liquidation of all positions:');
    if (confirmStop === 'STOP') {
      this.riskSvc.triggerEmergencyStop().subscribe({
        next: () => {
          this.notify.error('Emergency Stop', 'All positions closed. Bot stopped.');
          this.loadRiskData();
        },
        error: (err: any) => this.notify.error('Action Failed', err.message)
      });
    }
  }

  getBuffer(current: number, limit: number): number {
    return limit - Math.abs(current);
  }
}
