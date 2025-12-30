import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, switchMap, catchError, of, finalize, forkJoin } from 'rxjs'; // ✅ Added forkJoin

import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { SignalService } from '../../core/services/signal.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { StoreService } from '../../core/services/store.service';
import { OnboardingService } from '../../core/services/onboarding.service';

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
  isLoading = true;
  stats: DashboardStats = {
    todayPnL: 0, weeklyPnL: 0, monthlyPnL: 0, totalPnL: 0,
    unrealizedPnL: 0, winRate: 0, profitFactor: 0, activePositionsCount: 0,
    riskLimit: 5000, roi: 0
  };

  activePositions: Position[] = [];
  equityData: any[] = [];
  newSignals: Signal[] = [];

  private sub = new Subscription();

  constructor(
    private dashboardSvc: DashboardService,
    private positionSvc: PositionService,
    private signalSvc: SignalService,
    private wsService: WebSocketService,
    public store: StoreService,
    public onboarding: OnboardingService
  ) {}

  ngOnInit() {
    this.sub.add(
      this.store.state$.pipe(
        switchMap(() => {
          this.isLoading = true;
          // Fail-safe: If summary fails, return default stats so the app continues
          return this.dashboardSvc.getSummary().pipe(
            catchError(err => {
              console.error('Summary API Error:', err);
              return of(this.stats);
            })
          );
        })
      ).subscribe(data => {
        this.stats = data;
        this.loadWidgets();
      })
    );
    this.setupWebSockets();
  }

  loadWidgets() {
    // ✅ ROBUST FIX: Use forkJoin to load all widgets in parallel
    // If any single API fails, catchError returns empty data so the page still loads.
    this.sub.add(
      forkJoin({
        positions: this.positionSvc.getOpenPositions().pipe(catchError(() => of([]))),
        signals: this.signalSvc.getLatestSignals().pipe(catchError(() => of([]))),
        equity: this.dashboardSvc.getEquityCurve().pipe(catchError(() => of([])))
      }).pipe(
        finalize(() => {
          this.isLoading = false; // ✅ This GUARANTEES the loading spinner disappears
        })
      ).subscribe(results => {
        this.activePositions = results.positions;
        this.newSignals = results.signals;
        this.equityData = results.equity;
      })
    );
  }

  setupWebSockets() {
    // Connection might take time, so we don't block the UI here
    this.sub.add(this.wsService.subscribe('/topic/summary').subscribe(update => this.stats = { ...this.stats, ...update }));
    this.sub.add(this.wsService.subscribe('/topic/signals').subscribe(sig => this.newSignals = [sig, ...this.newSignals].slice(0, 5)));
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
