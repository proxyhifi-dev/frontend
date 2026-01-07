import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalService } from '../../core/services/signal.service';
import { NotificationService } from '../../core/services/notification.service';
import { Signal } from '../../core/models/domain.model';

@Component({
  selector: 'app-signals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss']
})
export class SignalsComponent implements OnInit {
  signals: (Signal & { expanded?: boolean })[] = [];
  isPaperMode = true;
  activeFilter: 'all' | 'pending' = 'all';
  lastScanLabel = 'N/A';

  constructor(
    private signalSvc: SignalService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadSignals();
    this.loadMode();
  }

  loadSignals() {
    const source$ = this.activeFilter === 'pending'
      ? this.signalSvc.getPendingSignals()
      : this.signalSvc.getSignals();
    source$.subscribe(data => {
      this.signals = data
        .slice()
        .sort((a, b) => new Date(b.scanTime).getTime() - new Date(a.scanTime).getTime())
        .map(s => ({ ...s, expanded: false }));
      if (this.signals.length > 0) {
        const latest = this.signals[0];
        this.lastScanLabel = latest.scanTime ? new Date(latest.scanTime).toLocaleString() : 'N/A';
      }
    });
  }

  loadMode() {
    this.signalSvc.getMode().subscribe({
      next: (data) => { this.isPaperMode = data.paperMode; },
      error: () => { this.isPaperMode = true; }
    });
  }

  toggleMode() {
    this.signalSvc.setMode(this.isPaperMode).subscribe({
      next: () => this.notify.success('Mode Updated', this.isPaperMode ? 'Paper mode enabled.' : 'Live mode enabled.'),
      error: (err: any) => this.notify.error('Mode Update Failed', err.message)
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

  getScoreColor(score: number): string {
    if (score >= 80) return '#00C853';
    if (score >= 60) return '#FFD600';
    return '#FF1744';
  }

  getStatusLabel(signal: Signal): string {
    return signal.hasEntrySignal ? 'ENTRY READY' : 'MONITOR';
  }
}
