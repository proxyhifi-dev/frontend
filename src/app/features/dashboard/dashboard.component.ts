import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BotService } from '../../core/services/bot.service';
import { StoreService } from '../../core/services/store.service';
import { forkJoin, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PositionView, Signal } from '../../core/models/domain.model';

// Import Child Components
import { BotStatusWidgetComponent } from './components/bot-status-widget.component';
import { EquityCurveChartComponent } from './components/equity-curve-chart.component';
// Assuming these exist based on your file list:
import { RiskHealthWidgetComponent } from './components/risk-health-widget.component';
import { RecentSignalsWidgetComponent } from './components/recent-signals-widget/recent-signals-widget.component';

export interface DashboardStats {
  todayPnL: number;
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
    RouterModule,
    BotStatusWidgetComponent,
    EquityCurveChartComponent,
    RiskHealthWidgetComponent,
    RecentSignalsWidgetComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    todayPnL: 0,
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
  timeRanges: string[] = ['1D', '5D', '1M', '3M', '6M', '1Y'];
  selectedTimeRange: string = '1D';
  isLoading: boolean = true;
  loadingMessage: string = 'Initializing Dashboard...'; // Added missing property

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private botService: BotService,
    private store: StoreService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupWebSocketSubscriptions();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const mode = this.store.snapshot.isLiveMode ? 'LIVE' : 'PAPER';
    this.stats.isLiveMode = this.store.snapshot.isLiveMode;

    const sub = forkJoin({
      summary: this.dashboardService.getSummary(mode),
      today: this.dashboardService.getTodayPnL(),
      unrealized: this.dashboardService.getUnrealizedPnL(),
      metrics: this.dashboardService.getPerformanceMetrics(),
      equity: this.dashboardService.getEquityCurve(mode),
      signals: this.dashboardService.getSignals(),
      positions: this.positionService.getOpenPositions()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ summary, today, unrealized, metrics, equity, signals, positions }) => {
          const totalCapital = summary.availableFunds ?? summary.availablePaperFunds ?? summary.availableRealFunds ?? summary.currentValue ?? 0;
          this.stats = {
            ...this.stats,
            todayPnL: today?.todayPnL ?? summary.todaysPnl ?? 0,
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
            lastScan: signals?.[0]?.scanTime ? new Date(signals[0].scanTime).toLocaleString() : 'N/A'
          };
          this.activePositions = positions;
          this.newSignals = signals;
          this.equityData = equity?.curve ?? equity ?? [];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Failed to load dashboard stats', error);
          this.isLoading = false;
          this.loadingMessage = 'Failed to load data.';
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

  toggleMode(): void {
    this.store.toggleMode();
    this.stats.isLiveMode = this.store.snapshot.isLiveMode;
    this.dashboardService.toggleMode(this.stats.isLiveMode).subscribe();
    this.loadDashboardData();
  }

  toggleNotifications(): void {
    // Toggle notifications visibility
  }

  toggleProfile(): void {
    // Toggle profile menu
  }

  pauseBot(): void {
    this.stats.isPaused = !this.stats.isPaused;
  }

  scanNow(): void {
    this.botService.scanNow().subscribe();
  }

  setTimeRange(range: string): void {
    this.selectedTimeRange = range;
  }

  expandPositions(): void {}

  closePosition(position: PositionView): void {}

  modifySL(position: PositionView): void {}

  viewAllSignals(): void {}

  viewFullRisk(): void {}

  navigateToDashboard(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
