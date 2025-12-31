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
import { Subscription } from 'rxjs';

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
  // ✅ Loading state with hard timeout
  isLoading: boolean = true;
  loadingMessage: string = 'Connecting to Market Data Feed...';
  
  // ✅ Data properties
  stats: any = {
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    roi: 0,
    totalCapital: 100000,
    totalTrades: 0,
    winningTrades: 0
  };
  
  equityData: any[] = [];
  activePositions: any[] = [];
  newSignals: any[] = [];
  
  private subscriptions: Subscription = new Subscription();
  private loadingTimeout: any;
  private initializationAttempts: number = 0;
  private maxInitializationAttempts: number = 3;
  
  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
  
  ngOnInit(): void {
    console.log('🎬 Dashboard component initializing...');
    console.log('Backend: http://127.0.0.1:8080');
    
    // ✅ CRITICAL: Hard timeout after 3 seconds - force show content regardless
    // ✅ Show dashboard after short delay to ensure rendering
this.ngZone.run(() => {
      setTimeout(() => {
        this.isLoading = false;
      }, 500);
    });
    
    
    
    // Load initial data
    this.loadInitialData();
    
    // Setup WebSocket listeners
    this.setupWebSockets();
  }
  
  private loadInitialData(): void {
    console.log('📡 Loading initial data from backend...');
    this.initializationAttempts++;
    
    // Load dashboard summary
    this.subscriptions.add(
      this.dashboardService.getSummary().subscribe({
        next: (data) => {
          console.log('✅ Dashboard stats loaded:', data);
          this.stats = { ...this.stats, ...data };
          this.isLoading = false;
          clearTimeout(this.loadingTimeout);
        },
        error: (err) => {
          console.error('❌ Error loading stats:', err);
          console.warn('Using fallback stats');
          // Don't block loading if stats fail
          this.isLoading = false;
          clearTimeout(this.loadingTimeout);
        }
      })
    );
    
    // Load equity curve
    this.subscriptions.add(
      this.dashboardService.getEquityCurve().subscribe({
        next: (data) => {
          console.log('✅ Equity data loaded:', data?.length || 0, 'points');
          this.equityData = data || [];
        },
        error: (err) => {
          console.warn('⚠️ Error loading equity curve:', err);
          this.equityData = [];
        }
      })
    );
    
    // Load positions
    this.subscriptions.add(
      this.positionService.getOpenPositions().subscribe({
        next: (data) => {
          console.log('✅ Positions loaded:', data?.length || 0);
          this.activePositions = data || [];
        },
        error: (err) => {
          console.warn('⚠️ Error loading positions:', err);
          this.activePositions = [];
        }
      })
    );
    
    // Load signals
    this.subscriptions.add(
      this.dashboardService.getSignals().subscribe({
        next: (data) => {
          console.log('✅ Signals loaded:', data?.length || 0);
          this.newSignals = data || [];
        },
        error: (err) => {
          console.warn('⚠️ Error loading signals:', err);
          this.newSignals = [];
        }
      })
    );
  }
  
  private setupWebSockets(): void {
    console.log('📡 Setting up WebSocket listeners...');
    
    // Subscribe to summary updates
    this.subscriptions.add(
      this.wsService.subscribe('/topic/summary').subscribe({
        next: (update) => {
          console.log('📡 Summary update received:', update);
          this.stats = { ...this.stats, ...update };
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
        },
        error: (err) => console.warn('⚠️ WebSocket signals error:', err)
      })
    );
  }
  
  ngOnDestroy(): void {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    this.subscriptions.unsubscribe();
  }
}
