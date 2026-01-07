import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskService } from '../../core/services/risk.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { CorrelationMatrix, RiskStatus } from '../../core/models/domain.model';

@Component({
  selector: 'app-risk',
  standalone: true,
 imports: [CommonModule, CurrencyInrPipe],
 templateUrl: './risk.component.html',
 styleUrls: ['./risk.component.scss']})
export class RiskComponent implements OnInit {
  riskStatus: RiskStatus = {
    equity: 0,
    openPositions: 0
  };

  correlation: CorrelationMatrix = {
    symbols: [],
    matrix: []
  };

  constructor(
    private riskSvc: RiskService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadRiskData();
  }

  loadRiskData() {
    this.riskSvc.getStatus().subscribe((data: RiskStatus) => this.riskStatus = data);
    this.riskSvc.getCorrelationMatrix().subscribe((data: CorrelationMatrix) => this.correlation = data);
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

  getRiskLabel(): string {
    if (this.riskStatus.openPositions >= 5) return 'HIGH';
    if (this.riskStatus.openPositions >= 3) return 'MEDIUM';
    return 'LOW';
  }
}
