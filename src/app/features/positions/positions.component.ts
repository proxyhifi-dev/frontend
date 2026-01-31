import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PositionService } from '../../core/services/position.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PositionView } from '../../core/models/domain.model';
import { ModeStore } from '../../core/services/mode-store.service';
import { RMultiplePipe } from '../../shared/pipes/r-multiple.pipe';
import { SafetyStatusService, SystemMode } from '../../core/services/safety-status.service';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

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
  exportSupported = false;
  tradingLocked = false;
  lockReason = '';
  lockMode: SystemMode = 'NORMAL';
  exitRetryingPositions: PositionView[] = [];
  readonly emptyStates = EMPTY_STATE_MESSAGES;
  private lastMode?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private positionSvc: PositionService,
    private notify: NotificationService,
    private modeStore: ModeStore,
    private safetyStatus: SafetyStatusService
  ) {}

  ngOnInit() {
    this.refresh();
    this.safetyStatus.lockState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.tradingLocked = state.locked;
        this.lockReason = state.reason;
        this.lockMode = state.mode;
      });
    this.positionSvc.closeSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.supportsClose = supported;
      });
    this.positionSvc.exportSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.exportSupported = supported;
      });
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
    this.positionSvc.getOpenPositions().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => this.openPositions = data,
      error: () => {
        this.openError = 'Failed to load open positions.';
        this.notify.error('Error', 'Failed to load open positions');
      }
    });

    this.positionSvc.getClosedPositions().pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (data) => {
        const list = data ?? [];
        this.exitRetryingPositions = list.filter((pos) => this.isExitRetrying(pos) || pos.exitConfirmed === false);
        this.closedPositions = list.filter((pos) => !this.isExitRetrying(pos) && pos.exitConfirmed !== false);
      },
      error: () => {
        this.closedError = 'Failed to load closed positions.';
        this.exitRetryingPositions = [];
      }
    });
  }

  closePosition(pos: PositionView) {
    if (this.tradingLocked) {
      this.notify.warning(this.lockMode, this.lockReason || 'Trading controls are locked.');
      return;
    }
    if (!this.supportsClose) {
      this.notify.warning('Action Unavailable', 'Not supported yet.');
      return;
    }
    if (!pos.symbol) {
      this.notify.warning('Action Unavailable', 'No symbol available to close.');
      return;
    }
    this.positionSvc.closePosition(pos).subscribe({
      next: () => {
        this.notify.success('Position Closed', `${pos.symbol} has been closed.`);
        this.refresh();
      },
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to close position.';
        this.notify.error('Close Failed', message);
      }
    });
  }

  exportCsv(): void {
    if (!this.exportSupported) {
      this.notify.warning('Action Unavailable', 'CSV export is not supported by the current backend.');
      return;
    }
    const exportUrl = this.positionSvc.getExportUrl();
    if (!exportUrl) {
      this.notify.error('Export Failed', 'Unable to resolve the export endpoint.');
      return;
    }
    window.open(exportUrl, '_blank');
  }

  isExitRetrying(pos: PositionView): boolean {
    const status = pos.exitStatus?.toUpperCase();
    return status === 'RETRYING' || status === 'EXIT_RETRYING';
  }

  getExitStatusLabel(pos: PositionView): string {
    return this.isExitRetrying(pos) ? 'EXIT RETRYING' : 'OPEN';
  }
}
