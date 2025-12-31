import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, catchError, of, finalize, forkJoin } from 'rxjs';

// Services
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { SignalService } from '../../core/services/signal.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { StoreService } from '../../core/services/store.service';
import { OnboardingService } from '../../core/services/onboarding.service';

// Components
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card';
import { EquityCurveChartComponent } from './components/equity-curve-chart.component';
import { PositionsWidgetComponent } from './components/positions-widget/positions-widget.component';
import { RecentSignalsWidgetComponent } from './components/recent-signals-widget/recent-signals-widget.component';
import { WelcomeWizardComponent } from './components/welcome-wizard/welcome-wizard.component';
import { DashboardStats, Position, Signal } from '../../core/models/domain.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    EquityCurveChartComponent,
    PositionsWidgetComponent,
    RecentSignalsWidgetComponent,
    WelcomeWizardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ✅ Start true, but we will force it false
  public isLoading = true;

  public stats: DashboardStats = {
    todayPnL: 0, weeklyPnL: 0, monthlyPnL: 0, totalPnL: 0,
    unrealizedPnL: 0, winRate: 0, profitFactor: 0, activePositionsCount: 0,
    riskLimit: 5000, roi: 0
  };

  public activePositions: Position[] = [];
  public equityData: any[] = [];
  public newSignals: Signal[] = [];

  private sub = new Subscription();

  constructor(
    public dashboardSvc: DashboardService,
    public positionSvc: PositionService,
    public signalSvc: SignalService,
    public wsService: WebSocketService,
    public store: StoreService,
    public onboarding: OnboardingService
  ) {}

  ngOnInit() {
    // ✅ SAFETY TIMER: Force loading screen to hide after 3 seconds
    setTimeout(() => {
      if (this.isLoading) {
        console.warn('⚠️ Backend slow/offline. Forcing Dashboard display.');
        this.isLoading = false;
      }
    }, 3000);

    this.loadAllData();
    this.setupWebSockets();
  }

  loadAllData() {
    const requests = {
      summary: this.dashboardSvc.getSummary().pipe(catchError(() => of(this.stats))),
      positions: this.positionSvc.getOpenPositions().pipe(catchError(() => of([]))),
      signals: this.signalSvc.getLatestSignals().pipe(catchError(() => of([]))),
      equity: this.dashboardSvc.getEquityCurve().pipe(catchError(() => of([])))
    };

    this.sub.add(
      forkJoin(requests).pipe(
        finalize(() => this.isLoading = false) // ✅ Ensure spinner stops
      ).subscribe(res => {
        this.stats = res.summary || this.stats;
        this.activePositions = res.positions;
        this.newSignals = res.signals;
        this.equityData = res.equity;
      })
    );
  }

  setupWebSockets() {
    this.sub.add(this.wsService.subscribe('/topic/summary').subscribe(u => { if(u) this.stats = {...this.stats, ...u}; }));
    this.sub.add(this.wsService.subscribe('/topic/signals').subscribe(s => { if(s) this.newSignals = [s, ...this.newSignals].slice(0, 5); }));
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
