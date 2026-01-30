import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { SignalService } from '../../core/services/signal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Signal, SignalDetail } from '../../core/models/domain.model';
import { StoreService } from '../../core/services/store.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { ModeStore } from '../../core/services/mode-store.service';
import { EntityDetailsComponent } from '../../shared/components/entity-details/entity-details.component';
import { ScanStoreService } from '../../core/services/scan-store.service';
import { SafetyStatusService, SystemMode } from '../../core/services/safety-status.service';

@Component({
  selector: 'app-signals',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, EntityDetailsComponent],
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss']
})
export class SignalsComponent implements OnInit, OnDestroy {
  signals: (Signal & { expanded?: boolean })[] = [];
  allSignals: (Signal & { expanded?: boolean })[] = [];
  activeFilter: 'all' | 'pending' = 'all';
  lastScanLabel = 'N/A';
  searchTerm = '';
  isLoading = false;
  errorMessage = '';
  tradingLocked = false;
  lockReason = '';
  lockMode: SystemMode = 'NORMAL';
  selectedSignal?: SignalDetail;
  isDrawerOpen = false;
  detailLoading = false;
  detailError = '';
  executionSupported = false;
  isScanRunning = false;
  cooldownUntil = 0;
  retryAfterSeconds = 0;
  cooldownSecondsLeft = 0;
  private cooldownInterval?: ReturnType<typeof setInterval>;
  private lastMode?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private signalSvc: SignalService,
    private notify: NotificationService,
    private store: StoreService,
    private modeStore: ModeStore,
    private scanStore: ScanStoreService,
    private safetyStatus: SafetyStatusService
  ) {}

  ngOnInit() {
    this.loadSignals();
    this.safetyStatus.lockState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.tradingLocked = state.locked;
        this.lockReason = state.reason;
        this.lockMode = state.mode;
      });
    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.searchTerm = state.searchSymbol ?? '';
        this.applySearch();
      });

    this.modeStore.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        if (this.lastMode !== mode) {
          this.lastMode = mode;
          this.loadSignals();
        }
      });

    this.signalSvc.executionSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.executionSupported = supported;
      });

    this.scanStore.isScanRunning$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isRunning) => {
        this.isScanRunning = isRunning;
      });

    this.scanStore.cooldownUntil$
      .pipe(takeUntil(this.destroy$))
      .subscribe((cooldownUntil) => {
        this.cooldownUntil = cooldownUntil;
        this.updateCooldownTimer();
      });

    this.scanStore.retryAfterSeconds$
      .pipe(takeUntil(this.destroy$))
      .subscribe((seconds) => {
        this.retryAfterSeconds = seconds;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  loadSignals() {
    this.isLoading = true;
    this.errorMessage = '';
    const source$ = this.activeFilter === 'pending'
      ? this.signalSvc.getPendingSignals()
      : this.signalSvc.getSignals();
    source$.pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false))
    )
      .subscribe({
        next: (data) => {
          this.allSignals = data
            .slice()
            .sort((a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime())
            .map(s => ({ ...s, expanded: false }));
          if (this.allSignals.length > 0) {
            const latest = this.allSignals[0];
            this.lastScanLabel = latest.scanTime ? new Date(latest.scanTime).toLocaleString() : 'N/A';
          }
          this.applySearch();
        },
        error: () => {
          this.errorMessage = 'Unable to load signals right now.';
          this.signals = [];
        }
      });
  }

  scanNow() {
    if (this.tradingLocked) {
      this.notify.warning(this.lockMode, this.lockReason || 'Trading controls are locked.');
      return;
    }
    if (this.isScanRunning || this.isCooldownActive()) {
      return;
    }
    this.scanStore.startScan();
    this.signalSvc.scanNow().pipe(
      finalize(() => this.scanStore.finishScan())
    ).subscribe({
      next: () => {
        this.notify.success('Scan Started', 'Manual scan triggered.');
        this.scanStore.setCooldown(30);
        this.loadSignals();
      },
      error: (err: unknown) => {
        const error = err as { status?: number; userMessage?: string };
        if (error?.status !== 429) {
          const message = error?.userMessage ?? 'Unable to start scan.';
          this.notify.error('Scan Failed', message);
        }
      }
    });
  }

  updateFilter(filter: 'all' | 'pending') {
    this.activeFilter = filter;
    this.loadSignals();
  }

  applySearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.signals = [...this.allSignals];
      return;
    }

    this.signals = this.allSignals.filter(signal =>
      signal.symbol?.toLowerCase().includes(term)
    );
  }

  onSearchChange() {
    this.store.setSearchSymbol(this.searchTerm);
    this.applySearch();
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#00C853';
    if (score >= 60) return '#FFD600';
    return '#FF1744';
  }

  getStatusLabel(signal: Signal): string {
    return signal.hasEntrySignal ? 'ENTRY READY' : 'MONITOR';
  }

  executeSignal(signal: Signal): void {
    if (this.tradingLocked) {
      this.notify.warning(this.lockMode, this.lockReason || 'Trading controls are locked.');
      return;
    }
    if (!signal.hasEntrySignal) {
      return;
    }
    this.signalSvc.executeSignal(signal.id).subscribe({
      next: () => {
        this.notify.success('Order Placed', `Trade executed for ${signal.symbol}.`);
        this.loadSignals();
      },
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to execute trade.';
        this.notify.error('Execution Failed', message);
      }
    });
  }

  openWhyDrawer(signal: Signal): void {
    this.detailLoading = true;
    this.detailError = '';
    this.isDrawerOpen = true;
    this.selectedSignal = undefined;
    this.signalSvc.getSignalDetail(signal.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.detailLoading = false))
    ).subscribe({
      next: (detail) => {
        this.selectedSignal = detail;
      },
      error: () => {
        this.detailError = 'Unable to load trade rationale.';
      }
    });
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
    this.selectedSignal = undefined;
  }

  isCooldownActive(): boolean {
    return this.cooldownUntil > Date.now();
  }

  private updateCooldownTimer(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    const updateSeconds = () => {
      const remainingMs = this.cooldownUntil - Date.now();
      if (remainingMs <= 0) {
        this.cooldownSecondsLeft = 0;
        this.scanStore.clearCooldown();
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = undefined;
        }
        return;
      }
      this.cooldownSecondsLeft = Math.ceil(remainingMs / 1000);
    };

    updateSeconds();
    if (this.cooldownUntil > Date.now()) {
      this.cooldownInterval = setInterval(updateSeconds, 1000);
    }
  }

}
