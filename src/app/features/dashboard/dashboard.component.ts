import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { EquityCurveChartComponent } from './components/equity-curve-chart.component';
import { PositionsWidgetComponent } from './components/positions-widget/positions-widget.component';
import { RecentSignalsWidgetComponent } from './components/recent-signals-widget/recent-signals-widget.component';
import { CircuitBreakerComponent } from '../risk/components/circuit-breaker/circuit-breaker.component';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    EquityCurveChartComponent,
    PositionsWidgetComponent,
    RecentSignalsWidgetComponent,
    CircuitBreakerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ✅ Loading state
  isLoading: boolean = true;
  loadingMessage: string = 'Loading real-time data...';

  // ✅ Data properties
  stats: any = {
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    roi: 0,
    totalCapital: 100000,
    totalTrades: 0,
    winningTrades: 0,
    netProfit: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    averageWin: 0,
    averageLoss: 0
  };

  equityData: any[] = [];
  activePositions: any[] = [];
  newSignals: any[] = [];

  private subscriptions: Subscription = new Subscription();
  private loadingTimeout: any;
  private refreshInterval: any;

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    console.log('🌞 Dashboard component initializing...');
    console.log('Backend: http://127.0.0.1:8080');

    // ✅ Load initial data immediately
    this.loadInitialData();

    // ✅ Set up periodic refresh every 5 seconds for real-time updates
    this.ngZone.runOutsideAngular(() => {
      this.refreshInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.loadPerformanceData();
        });
      }, 5000);
    });

    // Setup WebSocket listeners
    this.setupWebSockets();
  }

  private loadInitialData(): void {
    console.log('📡 Loading initial data from backend...');

    // Load all data in parallel
    this.subscriptions.add(
      forkJoin({
        performanceMetrics: this.dashboardService.getPerformanceMetrics(),
        todayPnL: this.dashboardService.getTodayPnL(),
        unrealizedPnL: this.dashboardService.getUnrealizedPnL(),
        roi: this.dashboardService.getROI(),
        winRate: this.dashboardService.getWinRate(),
        equityCurve: this.dashboardService.getEquityCurve('PAPER'),
        signals: this.dashboardService.getSignals(),
        positions: this.positionService.getOpenPositions()
      }).subscribe({
        next: (data) => {
          console.log('✅ All data loaded successfully');
          this.mergeData(data);
          this.isLoading = false;
          this.cdr.detectChanges();
          clearTimeout(this.loadingTimeout);
        },
        error: (err) => {
          console.error('❌ Error loading data:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      })
    );
  }

  private loadPerformanceData(): void {
    // Refresh performance metrics periodically
    this.subscriptions.add(
      forkJoin({
        performanceMetrics: this.dashboardService.getPerformanceMetrics(),
        todayPnL: this.dashboardService.getTodayPnL(),
        unrealizedPnL: this.dashboardService.getUnrealizedPnL()
      }).subscribe({
        next: (data) => {
          this.stats.totalTrades = data.performanceMetrics?.totalTrades || 0;
          this.stats.winRate = data.performanceMetrics?.winRate || 0;
          this.stats.netProfit = data.performanceMetrics?.netProfit || 0;
          this.stats.profitFactor = data.performanceMetrics?.profitFactor || 0;
          this.stats.maxDrawdown = data.performanceMetrics?.maxDrawdown || 0;
          this.stats.todayPnL = data.todayPnL?.todayPnL || 0;
          this.stats.unrealizedPnL = data.unrealizedPnL?.unrealizedPnL || 0;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn('⚠️ Error refreshing performance data:', err);
        }
      })
    );
  }

  private mergeData(data: any): void {
    // Merge all loaded data into stats
    if (data.performanceMetrics) {
      this.stats = {
        ...this.stats,
        totalTrades: data.performanceMetrics.totalTrades || 0,
        winRate: data.performanceMetrics.winRate || 0,
        netProfit: data.performanceMetrics.netProfit || 0,
        profitFactor: data.performanceMetrics.profitFactor || 0,
        maxDrawdown: data.performanceMetrics.maxDrawdown || 0,
        winningTrades: data.performanceMetrics.winningTrades || 0
      };
    }

    if (data.todayPnL) {
      this.stats.todayPnL = data.todayPnL.todayPnL || 0;
    }

    if (data.unrealizedPnL) {
      this.stats.unrealizedPnL = data.unrealizedPnL.unrealizedPnL || 0;
    }

    if (data.roi) {
      this.stats.roi = data.roi.value || 0;
    }

    if (data.equityCurve && data.equityCurve.curve) {
      this.equityData = Array.from(data.equityCurve.curve);
    }

    if (data.signals && Array.isArray(data.signals)) {
      this.newSignals = data.signals;
    }

    if (data.positions && Array.isArray(data.positions)) {
      this.activePositions = data.positions;
    }
  }

  private setupWebSockets(): void {
    console.log('📡 Setting up WebSocket listeners...');

    // Subscribe to summary updates
    this.subscriptions.add(
      this.wsService.subscribe('/topic/summary').subscribe({
        next: (update) => {
          console.log('📡 Summary update received:', update);
          this.stats = { ...this.stats, ...update };
          this.cdr.detectChanges();
        },
        error: (err) => console.warn('⚠️ WebSocket summary error:', err)
      })
    );

    // Subscribe to position updates
    this.subscriptions.add(
      this.wsService.subscribe('/topic/positions').subscribe({
        next: (positions) => {
          console.log('📡 Positions update received:', positions?.length || 0);
          this.activePositions = positions || [];
          this.cdr.detectChanges();
        },
        error: (err) => console.warn('⚠️ WebSocket positions error:', err)
      })
    );

    // Subscribe to signal updates
    this.subscriptions.add(
      this.wsService.subscribe('/topic/signals').subscribe({
        next: (signal) => {
          console.log('📡 New signal received:', signal?.symbol);
          this.newSignals = [signal, ...this.newSignals].slice(0, 10);
          this.cdr.detectChanges();
        },
        error: (err) => console.warn('⚠️ WebSocket signals error:', err)
      })
    );
  }

  ngOnDestroy(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.subscriptions.unsubscribe();
  }
}
