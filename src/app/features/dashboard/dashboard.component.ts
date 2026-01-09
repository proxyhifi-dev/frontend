import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BotService } from '../../core/services/bot.service';
import { StoreService } from '../../core/services/store.service';
import { NotificationService } from '../../core/services/notification.service';
import { forkJoin, Subscription, Subject, timer } from 'rxjs';
import { map, scan, shareReplay, startWith, takeUntil } from 'rxjs/operators';
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
  backendUnavailable = false;

  scanInterval: number = 45;
  currentTime$ = timer(0, 1000).pipe(
    map(() => new Date()),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  isMarketOpen$ = this.currentTime$.pipe(
    map((now) => {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      return (hours > 9 && hours < 15) || (hours === 9 && minutes >= 15) || (hours === 15 && minutes <= 30);
    })
  );
  scanCountdown$ = timer(0, 1000).pipe(
    startWith(0),
    scan((countdown) => {
      if (this.stats.isPaused) {
        return countdown;
      }
      return countdown > 0 ? countdown - 1 : this.scanInterval;
    }, this.scanInterval),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  scanProgress$ = this.scanCountdown$.pipe(
    map((countdown) => ((this.scanInterval - countdown) / this.scanInterval) * 100)
  );
  maxPositions: number = 3;
  supportsClose = false;

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

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

  loadDashboardData(): void {
    this.isLoading = true;
    this.backendUnavailable = false;
    this.stats.isLiveMode = this.store.snapshot.isLiveMode;

    const sub = forkJoin({
      summary: this.dashboardService.getSummary(),
      today: this.dashboardService.getTodayPnL(),
      unrealized: this.dashboardService.getUnrealizedPnL(),
      metrics: this.dashboardService.getPerformanceMetrics(),
      equity: this.dashboardService.getEquityCurve(this.stats.isLiveMode ? 'LIVE' : 'PAPER'),
      signals: this.dashboardService.getSignals(),
      positions: this.positionService.getOpenPositions()
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
            this.backendUnavailable = true;
            this.loadingMessage = 'Backend unavailable.';
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
  }
}
