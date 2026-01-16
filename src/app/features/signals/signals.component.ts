import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { SignalService } from '../../core/services/signal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Signal, SignalDetail } from '../../core/models/domain.model';
import { StoreService } from '../../core/services/store.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { RiskService } from '../../core/services/risk.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { EntityDetailsComponent } from '../../shared/components/entity-details/entity-details.component';

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
  safeMode = false;
  safeModeReason = '';
  selectedSignal?: SignalDetail;
  isDrawerOpen = false;
  detailLoading = false;
  detailError = '';
  executionSupported = false;
  private lastMode?: string;
  private destroy$ = new Subject<void>();

  constructor(
    private signalSvc: SignalService,
    private notify: NotificationService,
    private store: StoreService,
    private modeStore: ModeStore,
    private riskService: RiskService
  ) {}

  ngOnInit() {
    this.loadSignals();
    this.loadCircuitBreaker();
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    if (this.safeMode) {
      this.notify.warning('Safe Mode', this.safeModeReason || 'Risk circuit breaker triggered.');
      return;
    }
    this.signalSvc.scanNow().subscribe({
      next: () => {
        this.notify.success('Scan Started', 'Manual scan triggered.');
        this.loadSignals();
      },
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to start scan.';
        this.notify.error('Scan Failed', message);
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
    if (this.safeMode) {
      this.notify.warning('Safe Mode', this.safeModeReason || 'Risk circuit breaker triggered.');
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
