import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SignalService } from '../../core/services/signal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Signal } from '../../core/models/domain.model';
import { StoreService } from '../../core/services/store.service';

@Component({
  selector: 'app-signals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss']
})
export class SignalsComponent implements OnInit, OnDestroy {
  signals: (Signal & { expanded?: boolean })[] = [];
  allSignals: (Signal & { expanded?: boolean })[] = [];
  activeFilter: 'all' | 'pending' = 'all';
  lastScanLabel = 'N/A';
  searchTerm = '';
  private lastMode?: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private signalSvc: SignalService,
    private notify: NotificationService,
    private store: StoreService
  ) {}

  ngOnInit() {
    this.loadSignals();
    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.searchTerm = state.searchSymbol ?? '';
        if (this.lastMode !== state.isLiveMode) {
          this.lastMode = state.isLiveMode;
          this.loadSignals();
        } else {
          this.applySearch();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSignals() {
    const source$ = this.activeFilter === 'pending'
      ? this.signalSvc.getPendingSignals()
      : this.signalSvc.getSignals();
    source$.subscribe(data => {
      this.allSignals = data
        .slice()
        .sort((a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime())
        .map(s => ({ ...s, expanded: false }));
      if (this.allSignals.length > 0) {
        const latest = this.allSignals[0];
        this.lastScanLabel = latest.scanTime ? new Date(latest.scanTime).toLocaleString() : 'N/A';
      }
      this.applySearch();
    });
  }

  scanNow() {
    this.signalSvc.scanNow().subscribe({
      next: () => {
        this.notify.success('Scan Started', 'Manual scan triggered.');
        this.loadSignals();
      },
      error: (err: any) => this.notify.error('Scan Failed', err.message)
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
    if (!signal.hasEntrySignal) {
      return;
    }
    this.signalSvc.executeSignal(signal.id).subscribe({
      next: () => {
        this.notify.success('Order Placed', `Trade executed for ${signal.symbol}.`);
        this.loadSignals();
      },
      error: (err: any) => {
        this.notify.error('Execution Failed', err?.message || 'Unable to execute trade.');
      }
    });
  }
}
