import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradingService, UserProfile, Signal, Trade, TradeStats, PaperPosition, PaperStats } from './services/trading.service';
import { RiskService } from './services/risk.service';
import { NotificationService } from './services/notification.service';
import { RiskStatus } from './models/risk-status.model';
import { Subscription, timer, of } from 'rxjs';
import { switchMap, catchError, retry, share } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // ... (Keep existing properties)
  isPaperMode: boolean = true;
  apiStatus: 'Connected' | 'Disconnected' | 'Syncing...' = 'Syncing...';
  lastSyncTime: string = '--:--:--';

  // Data State
  user: UserProfile | null = null;
  pendingSignals: Signal[] = [];
  trades: Trade[] = [];
  portfolioStats: TradeStats | null = null;
  paperPositions: PaperPosition[] = [];
  paperStats: PaperStats | null = null;
  riskStatus: RiskStatus | null = null;

  // UI State
  activeSignal: Signal | null = null;
  showConfirmation = false;
  currentView: 'dashboard' | 'trades' | 'portfolio' = 'dashboard';

  private pollingSub: Subscription | null = null;

  constructor(
    private tradingService: TradingService,
    private riskService: RiskService,
    public notify: NotificationService // Public for template access
  ) {}

  ngOnInit() {
    this.startLiveSync();
  }

  ngOnDestroy() {
    this.pollingSub?.unsubscribe();
  }

  // ✅ FIXED: Robust Polling Architecture
  startLiveSync() {
    this.pollingSub = timer(0, 3000) // Poll every 3 seconds
      .pipe(
        switchMap(() => this.tradingService.getProfile().pipe(
          catchError(err => {
            this.apiStatus = 'Disconnected';
            return of(null); // Keep stream alive
          })
        )),
        retry(3) // Retry failed requests
      )
      .subscribe(profile => {
        if (profile) {
          this.user = profile;
          this.apiStatus = 'Connected';
          this.lastSyncTime = new Date().toLocaleTimeString();

          // Fetch secondary data
          this.refreshSecondaryData();
        }
      });
  }

  refreshSecondaryData() {
    this.tradingService.getPendingSignals().subscribe(s => this.pendingSignals = s);
    this.tradingService.getRecentTrades(10).subscribe(t => this.trades = t);
    this.riskService.getRiskStatus().subscribe(r => this.riskStatus = r);
    // ... fetch other stats
  }

  // ✅ FIXED: Non-blocking Actions
  toggleMode() {
    if (!this.isPaperMode) {
      // Switching TO Paper is safe
      this.isPaperMode = true;
      this.notify.success('Switched to Paper Trading');
    } else {
      // Switching TO Live requires confirmation
      if (confirm('⚠️ WARNING: Switch to LIVE MONEY mode? Real funds will be used.')) {
        this.isPaperMode = false;
        this.notify.show('Switched to LIVE TRADING', 'info');
      }
    }
  }

  onApprove(signal: Signal) {
    this.activeSignal = signal;
    if (!this.isPaperMode) {
      this.showConfirmation = true; // Show Modal
    } else {
      this.executeTrade(signal, true);
    }
  }

  confirmLiveTrade() {
    if (this.activeSignal) {
      this.executeTrade(this.activeSignal, false);
      this.showConfirmation = false;
      this.activeSignal = null;
    }
  }

  executeTrade(signal: Signal, isPaper: boolean) {
    this.tradingService.approveSignal(signal.id, isPaper).subscribe({
      next: () => {
        this.notify.success(`Order placed for ${signal.symbol}`);
        this.refreshSecondaryData();
      },
      error: (err) => this.notify.error('Order Failed: ' + err.message)
    });
  }

  exitPosition(symbol: string, qty: number) {
    if(!confirm(`Close position for ${symbol}?`)) return;

    this.tradingService.placeOrder(symbol, qty, 'SELL', this.isPaperMode).subscribe({
      next: () => this.notify.success(`Exited ${symbol}`),
      error: (e) => this.notify.error('Exit failed')
    });
  }

  changeView(view: any) { this.currentView = view; }
  cancelConfirmation() { this.showConfirmation = false; this.activeSignal = null; }
}
