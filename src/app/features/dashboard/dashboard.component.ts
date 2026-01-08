import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BotService } from '../../core/services/bot.service';
import { StoreService } from '../../core/services/store.service';
import { NotificationService } from '../../core/services/notification.service';
import { forkJoin, Subscription, Subject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { PositionView, Signal } from '../../core/models/domain.model';

export interface DashboardStats {
  todayPnL: number;
  weeklyPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  portfolioValue: number;
  accountBalance: number;
  equityUsed: number;
  equityAvailable: number;
  isLiveMode: boolean;
  botStatus: string;
  activePositions: number;
  circuitBreakerStatus: string;
  lastScan: string;
  nextScan: string;
  scannedStocks: number;
  totalStocks: number;
  signalsFound: number;
  roi: number;
  totalCapital: number;
  dailyLossLimit: number;
  dailyLossUsed: number;
  dailyBuffer: number;
  consecutiveLosses: number;
  maxDrawdown: number;
  isPaused: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    todayPnL: 0,
    weeklyPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    totalTrades: 0,
    portfolioValue: 0,
    accountBalance: 0,
    equityUsed: 0,
    equityAvailable: 0,
    isLiveMode: false,
    botStatus: 'IDLE',
    activePositions: 0,
    circuitBreakerStatus: 'SAFE',
    lastScan: 'N/A',
    nextScan: 'N/A',
    scannedStocks: 0,
    totalStocks: 0,
    signalsFound: 0,
    roi: 0,
    totalCapital: 0,
    dailyLossLimit: 5000,
    dailyLossUsed: 0,
    dailyBuffer: 5000,
    consecutiveLosses: 0,
    maxDrawdown: 0,
    isPaused: false
  };

  activePositions: PositionView[] = [];
  newSignals: Signal[] = [];
  notifications: any[] = [];
  equityData: any[] = [];
  isLoading: boolean = true;
  loadingMessage: string = 'Initializing Dashboard...';
  dataWarnings: string[] = [];

  currentTime: string = '--:--:--';
  isMarketOpen: boolean = false;
  scanCountdown: number = 45;
  scanInterval: number = 45;
  maxPositions: number = 3;
  supportsClose = false;

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  private clockIntervalId?: number;
  private scanIntervalId?: number;

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private botService: BotService,
    private store: StoreService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupWebSocketSubscriptions();
    this.startClock();
    this.startScanCountdown();
    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (this.stats.isLiveMode !== state.isLiveMode) {
          this.stats.isLiveMode = state.isLiveMode;
          this.loadDashboardData();
        }
      });
  }

  get todayPnlPercent(): number {
    return this.stats.totalCapital ? (this.stats.todayPnL / this.stats.totalCapital) * 100 : 0;
  }

  get weeklyPnlPercent(): number {
    return this.stats.totalCapital ? (this.stats.weeklyPnL / this.stats.totalCapital) * 100 : 0;
  }

  get circuitUsage(): number {
    if (!this.stats.dailyLossLimit) {
      return 0;
    }
    return Math.min(100, (Math.abs(this.stats.dailyLossUsed) / this.stats.dailyLossLimit) * 100);
  }

  get circuitStatus(): string {
    if (this.circuitUsage >= 90) {
      return 'Critical';
    }
    if (this.circuitUsage >= 70) {
      return 'Warning';
    }
    return 'Safe';
  }

  get scanProgress(): number {
    return ((this.scanInterval - this.scanCountdown) / this.scanInterval) * 100;
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dataWarnings = [];
    const mode = this.store.snapshot.isLiveMode ? 'LIVE' : 'PAPER';
    this.stats.isLiveMode = this.store.snapshot.isLiveMode;

    const sub = forkJoin({
      summary: this.dashboardService.getSummary(mode).pipe(
        catchError(() => {
          this.dataWarnings.push('Account summary unavailable.');
          return of({
            name: 'Trader',
            availableFunds: 0,
            availableRealFunds: 0,
            availablePaperFunds: 0,
            totalInvested: 0,
            currentValue: 0,
            todaysPnl: 0,
            holdings: []
          });
        })
      ),
      today: this.dashboardService.getTodayPnL().pipe(
        catchError(() => {
          this.dataWarnings.push('Today P&L unavailable.');
          return of({ todayPnL: 0, tradesCount: 0 });
        })
      ),
      unrealized: this.dashboardService.getUnrealizedPnL().pipe(
        catchError(() => {
          this.dataWarnings.push('Unrealized P&L unavailable.');
          return of({ unrealizedPnL: 0, openPositions: 0 });
        })
      ),
      metrics: this.dashboardService.getPerformanceMetrics().pipe(
        catchError(() => {
          this.dataWarnings.push('Performance metrics unavailable.');
          return of({
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            netProfit: 0,
            profitFactor: 0,
            averageWin: 0,
            averageLoss: 0,
            maxDrawdown: 0
          });
        })
      ),
      equity: this.dashboardService.getEquityCurve(mode).pipe(
        catchError(() => {
          this.dataWarnings.push('Equity curve unavailable.');
          return of({ type: mode, curve: [] });
        })
      ),
      signals: this.dashboardService.getSignals().pipe(
        catchError(() => {
          this.dataWarnings.push('Signals unavailable.');
          return of([]);
        })
      ),
      positions: this.positionService.getOpenPositions().pipe(
        catchError(() => {
          this.dataWarnings.push('Positions unavailable.');
          return of([]);
        })
      )
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ summary, today, unrealized, metrics, equity, signals, positions }) => {
          const totalCapital = summary.availableFunds ?? summary.availablePaperFunds ?? summary.availableRealFunds ?? summary.currentValue ?? 0;
          queueMicrotask(() => {
            this.stats = {
              ...this.stats,
              todayPnL: today?.todayPnL ?? summary.todaysPnl ?? 0,
              weeklyPnL: metrics?.netProfit ?? 0,
              unrealizedPnL: unrealized?.unrealizedPnL ?? 0,
              winRate: metrics?.winRate ?? 0,
              totalTrades: metrics?.totalTrades ?? 0,
              roi: summary.currentValue && summary.totalInvested
                ? ((summary.currentValue - summary.totalInvested) / summary.totalInvested) * 100
                : 0,
              totalCapital,
              portfolioValue: summary.currentValue ?? 0,
              accountBalance: summary.availableFunds ?? summary.availablePaperFunds ?? 0,
              activePositions: positions.length,
              lastScan: signals?.[0]?.scanTime ? new Date(signals[0].scanTime).toLocaleString() : 'N/A',
              signalsFound: signals?.length ?? 0
            };
            this.activePositions = positions;
            this.newSignals = signals;
            this.equityData = equity?.curve ?? equity ?? [];
            this.isLoading = false;
          });
        },
        error: (error: any) => {
          console.error('Failed to load dashboard stats', error);
          queueMicrotask(() => {
            this.isLoading = false;
            this.loadingMessage = 'Failed to load data.';
          });
        }
      });
    this.subscriptions.push(sub);
  }

  setupWebSocketSubscriptions(): void {
    const sub = this.wsService.connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
    this.subscriptions.push(sub);
  }

  startClock(): void {
    this.updateClock();
    this.clockIntervalId = window.setInterval(() => this.updateClock(), 1000);
  }

  updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour12: true });

    const hours = now.getHours();
    const minutes = now.getMinutes();
    this.isMarketOpen = (hours > 9 && hours < 15) || (hours === 9 && minutes >= 15) || (hours === 15 && minutes <= 30);
  }

  startScanCountdown(): void {
    this.scanIntervalId = window.setInterval(() => {
      if (this.stats.isPaused) {
        return;
      }
      this.scanCountdown = this.scanCountdown > 0 ? this.scanCountdown - 1 : this.scanInterval;
    }, 1000);
  }

  toggleMode(): void {
    this.store.toggleMode();
    this.stats.isLiveMode = this.store.snapshot.isLiveMode;
    this.dashboardService.toggleMode(this.stats.isLiveMode).subscribe();
    this.loadDashboardData();
  }

  pauseBot(): void {
    this.stats.isPaused = !this.stats.isPaused;
  }

  scanNow(): void {
    this.botService.scanNow().subscribe();
  }

  getPositionTarget(position: PositionView): number {
    return position.entryPrice * 1.05;
  }

  getPositionProgress(position: PositionView): number {
    const target = this.getPositionTarget(position);
    if (target === position.entryPrice) {
      return 0;
    }
    const progress = ((position.currentPrice - position.entryPrice) / (target - position.entryPrice)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  closeActivePosition(position: PositionView): void {
    if (!this.supportsClose) {
      this.notify.warning('Action Unavailable', 'Not supported yet.');
      return;
    }
    if (!position.id) {
      this.notify.warning('Action Unavailable', `No position ID for ${position.symbol}.`);
      return;
    }
    this.positionService.closePosition(position.id).subscribe({
      next: () => {
        this.notify.success('Position Closed', `${position.symbol} has been closed.`);
        this.loadDashboardData();
      },
      error: (err: any) => {
        this.notify.error('Close Failed', err?.message || 'Unable to close position.');
      }
    });
  }

  navigateToDashboard(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.clockIntervalId) {
      window.clearInterval(this.clockIntervalId);
    }
    if (this.scanIntervalId) {
      window.clearInterval(this.scanIntervalId);
    }
  }
}
