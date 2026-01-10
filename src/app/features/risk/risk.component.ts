import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskService } from '../../core/services/risk.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { CorrelationMatrix, RiskStatus } from '../../core/models/domain.model';
import { BotService } from '../../core/services/bot.service';
import { PositionService } from '../../core/services/position.service';
import { StoreService } from '../../core/services/store.service';
import { finalize, forkJoin } from 'rxjs';

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
  isLoading = false;
  errorMessage = '';

  constructor(
    private riskSvc: RiskService,
    private notify: NotificationService,
    private botService: BotService,
    private positionService: PositionService,
    private store: StoreService
  ) {}

  ngOnInit() {
    this.loadRiskData();
  }

  loadRiskData() {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      status: this.riskSvc.getStatus(),
      correlation: this.riskSvc.getCorrelationMatrix()
    }).pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ status, correlation }) => {
          this.riskStatus = status;
          this.correlation = correlation;
        },
        error: () => {
          this.errorMessage = 'Unable to load risk data.';
        }
      });
  }

  emergencyStop() {
    const confirmStop = prompt('Type "STOP" to confirm emergency liquidation of all positions:');
    if (confirmStop === 'STOP') {
      this.riskSvc.triggerEmergencyStop().subscribe({
        next: () => {
          this.notify.error('Emergency Stop', 'All positions closed. Bot stopped.');
          forkJoin({
            risk: this.riskSvc.getStatus(),
            correlation: this.riskSvc.getCorrelationMatrix(),
            positions: this.positionService.getOpenPositions(),
            bot: this.botService.fetchStatus()
          }).subscribe(() => {
            this.store.setMode(false);
            this.loadRiskData();
          });
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
