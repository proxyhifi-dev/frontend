import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
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
  autoApproveVal = false;
  activeFilter: 'all' | 'approved' | 'rejected' | 'pending' = 'all';

  constructor(
    private signalSvc: SignalService,
    private store: StoreService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadSignals();
  }

  loadSignals() {
    this.signalSvc.getLatestSignals().subscribe(data => {
      this.signals = data.map(s => ({ ...s, expanded: false }));
    });
  }

  approve(signal: Signal) {
    this.signalSvc.approveSignal(signal.id).subscribe({
      next: () => {
        this.notify.success('Signal Approved', `Order sent for ${signal.symbol}`);
        this.loadSignals();
      },
      error: (err: any) => this.notify.error('Approval Failed', err.message)
    });
  }

  getGateClass(passed: boolean): string {
    return passed ? 'gate-pass' : 'gate-fail';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#00C853';
    if (score >= 80) return '#64DD17';
    if (score >= 70) return '#FFD600';
    return '#FF1744';
  }
}
