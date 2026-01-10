import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PositionService } from '../../core/services/position.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PositionView } from '../../core/models/domain.model';
import { ModeStore } from '../../core/services/mode-store.service';
import { RMultiplePipe } from '../../shared/pipes/r-multiple.pipe';
import { RiskService } from '../../core/services/risk.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe, RMultiplePipe],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss']
})
export class PositionsComponent implements OnInit, OnDestroy {
  activeTab: 'open' | 'closed' = 'open';
  openPositions: PositionView[] = [];
  closedPositions: PositionView[] = [];
  isLoading = false;
  openError = '';
  closedError = '';
  supportsClose = false;
  safeMode = false;
  safeModeReason = '';
  private lastMode?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private positionSvc: PositionService,
    private notify: NotificationService,
    private modeStore: ModeStore,
    private riskService: RiskService
  ) {}

  ngOnInit() {
    this.refresh();
    this.loadCircuitBreaker();
    this.modeStore.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        if (this.lastMode !== mode) {
          this.lastMode = mode;
          this.refresh();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.isLoading = true;
    this.openError = '';
    this.closedError = '';
    this.positionSvc.getOpenPositions().subscribe({
      next: (data) => this.openPositions = data,
      error: () => {
        this.openError = 'Failed to load open positions.';
        this.notify.error('Error', 'Failed to load open positions');
      }
    });

    this.positionSvc.getClosedPositions().pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (data) => {
        this.closedPositions = data;
      },
      error: () => {
        this.closedError = 'Failed to load closed positions.';
      }
    });
  }

  closePosition(pos: PositionView) {
    if (this.safeMode) {
      this.notify.warning('Safe Mode', this.safeModeReason || 'Risk circuit breaker triggered.');
      return;
    }
    if (!this.supportsClose) {
      this.notify.warning('Action Unavailable', 'Not supported yet.');
      return;
    }
    if (!pos.id) {
      this.notify.warning('Action Unavailable', `No position ID for ${pos.symbol}.`);
      return;
    }
    this.positionSvc.closePosition(pos.id).subscribe({
      next: () => {
        this.notify.success('Position Closed', `${pos.symbol} has been closed.`);
        this.refresh();
      },
      error: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to close position.';
        this.notify.error('Close Failed', message);
      }
    });
  }

  private loadCircuitBreaker(): void {
    this.riskService.getCircuitBreakerStatus().pipe(takeUntil(this.destroy$)).subscribe({
      next: (status) => {
        this.safeMode = !!status?.triggered;
        this.safeModeReason = status?.reason ?? '';
      },
      error: () => {
        this.safeMode = false;
        this.safeModeReason = '';
      }
    });
  }
}
