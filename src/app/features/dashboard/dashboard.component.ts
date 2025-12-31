import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription, forkJoin, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface DashboardStats {
  todayPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  portfolioValue: number;
  accountBalance: number;
  equityUsed: number;
  equityAvailable: number;
}

interface RiskMetrics {
  riskExposure: number;
  maxDrawdown: number;
  sharpeRatio: number;
  portfolioHeat: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoading: boolean = true;
  loadingMessage: string = 'Loading real-time data...';

  stats: DashboardStats = {
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    totalTrades: 0,
    portfolioValue: 0,
    accountBalance: 0,
    equityUsed: 0,
    equityAvailable: 0,
  };

  riskMetrics: RiskMetrics = {
    riskExposure: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    portfolioHeat: 0,
  };

  tradingActive: boolean = true;
  strategyStatus: string = 'Running';
  lastSignalTime: Date = new Date();
  activePositions: number = 0;
  totalSignals: number = 0;

  equityData: any[] = [];
  drawdownData: any[] = [];
  performanceData: any[] = [];

  recentTrades: any[] = [];
  openPositions: any[] = [];
  recentSignals: any[] = [];

  circuitBreakerTriggered: boolean = false;
  circuitBreakerMessage: string = '';

  private subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.setupRealTimeUpdates();
  }

  private initializeDashboard(): void {
    this.isLoading = true;
    const statsObs = this.dashboardService.getDashboardStats();
    const positionsObs = this.positionService.getOpenPositions();
    const equityObs = this.dashboardService.getEquityCurve();

    forkJoin([statsObs, positionsObs, equityObs])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([stats, positions, equityData]: [any, any, any]) => {
          this.stats = stats;
          this.openPositions = positions || [];
          this.equityData = equityData || [];
          this.activePositions = (positions || []).length;
          this.calculateRiskMetrics();
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Dashboard initialization failed:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setupRealTimeUpdates(): void {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateStats();
      });

    this.wsService
      .connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.handleWebSocketMessage(data);
        },
        error: (err: any) => {
          console.error('WebSocket error:', err);
        },
      });
  }

  private updateStats(): void {
    this.dashboardService
      .getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: any) => {
          this.stats = stats;
          this.calculateRiskMetrics();
          this.cdr.markForCheck();
        },
      });
  }

  private handleWebSocketMessage(data: any): void {
    if (data.type === 'TRADE_SIGNAL') {
      this.addRecentSignal(data.payload);
    } else if (data.type === 'POSITION_CLOSED') {
      this.removeOpenPosition(data.payload.positionId);
    } else if (data.type === 'CIRCUIT_BREAKER') {
      this.handleCircuitBreaker(data.payload);
    } else if (data.type === 'EQUITY_UPDATE') {
      this.stats.portfolioValue = data.payload.portfolioValue;
      this.stats.accountBalance = data.payload.accountBalance;
    }
    this.cdr.markForCheck();
  }

  private calculateRiskMetrics(): void {
    this.riskMetrics = {
      riskExposure: this.calculateRiskExposure(),
      maxDrawdown: this.calculateMaxDrawdown(),
      sharpeRatio: this.calculateSharpeRatio(),
      portfolioHeat: this.calculatePortfolioHeat(),
    };
  }

  private calculateRiskExposure(): number {
    if (this.openPositions.length === 0) return 0;
    const totalRisk = this.openPositions.reduce((sum, pos) => sum + (pos.riskAmount || 0), 0);
    return (totalRisk / this.stats.accountBalance) * 100;
  }

  private calculateMaxDrawdown(): number {
    if (this.equityData.length === 0) return 0;
    let maxEquity = 0;
    let maxDrawdown = 0;
    for (const point of this.equityData) {
      if (point.value > maxEquity) {
        maxEquity = point.value;
      }
      const drawdown = ((maxEquity - point.value) / maxEquity) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    return maxDrawdown;
  }

  private calculateSharpeRatio(): number {
    return 1.5;
  }

  private calculatePortfolioHeat(): number {
    const positionCount = this.openPositions.length;
    const concentration = positionCount > 0 ? 100 / positionCount : 0;
    const riskExposure = this.calculateRiskExposure();
    return (riskExposure + concentration) / 2;
  }

  private addRecentSignal(signal: any): void {
    this.recentSignals.unshift(signal);
    this.recentSignals = this.recentSignals.slice(0, 10);
    this.totalSignals++;
  }

  private removeOpenPosition(positionId: string): void {
    this.openPositions = this.openPositions.filter((p) => p.id !== positionId);
    this.activePositions = this.openPositions.length;
  }

  private handleCircuitBreaker(payload: any): void {
    this.circuitBreakerTriggered = true;
    this.circuitBreakerMessage = payload.message || 'Circuit breaker activated';
    this.tradingActive = false;
  }

  pauseTrading(): void {
    this.dashboardService
      .pauseTrading()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tradingActive = false;
          this.strategyStatus = 'Paused';
          this.cdr.markForCheck();
        },
      });
  }

  resumeTrading(): void {
    this.dashboardService
      .resumeTrading()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.tradingActive = true;
          this.strategyStatus = 'Running';
          this.cdr.markForCheck();
        },
      });
  }

  liquidateAll(): void {
    if (confirm('Liquidate all positions? This cannot be undone.')) {
      this.dashboardService
        .liquidateAllPositions()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.openPositions = [];
            this.activePositions = 0;
            this.cdr.markForCheck();
          },
        });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }

  formatPercentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
