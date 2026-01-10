import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { PositionService } from './position.service';
import { RiskService, CircuitBreakerStatus } from './risk.service';
import { SettingsService } from './settings.service';
import { TradingMode } from './trading-mode.service';
import { ToastService } from './toast.service';
import { PositionView, Signal } from '../models/domain.model';
import { ModeStore } from './mode-store.service';
import { AccountOverviewDTO } from '../models/account.dto';
import { MarketDataPoint } from '../models/market-data.model';
import { PnLMetrics } from '../models/pnl-metrics.dto';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
export type StrategyHealthStatus = 'OK' | 'DEGRADED' | 'BROKEN';

export interface BotStatusState {
  state: string;
  isPaused: boolean;
  lastScan: string;
  nextScan: string;
  scanInterval: number;
  signalsFound: number;
}

export interface AccountOverview {
  equity: number;
  usedMargin: number;
  freeMargin: number;
  dailyPnl: number;
  monthlyPnl: number;
  unrealizedPnl: number;
  drawdown: number;
  totalCapital: number;
  mode: TradingMode;
}

export interface StrategyHealth {
  status: StrategyHealthStatus;
  reasons: string[];
  updatedAt: string;
  isPaused: boolean;
  canManage: boolean;
}

export interface RiskSummary {
  dailyLossLimit: number;
  dailyLossUsed: number;
  bufferRemaining: number;
  maxDrawdown: number;
  portfolioHeat: number;
  circuitStatus: string;
}

export interface AlertEvent {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class TradingStoreService {
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('disconnected');
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();

  private botStatusSubject = new BehaviorSubject<BotStatusState>({
    state: 'IDLE',
    isPaused: false,
    lastScan: 'N/A',
    nextScan: 'N/A',
    scanInterval: 45,
    signalsFound: 0
  });
  readonly botStatus$ = this.botStatusSubject.asObservable();

  private positionsSubject = new BehaviorSubject<PositionView[]>([]);
  readonly positions$ = this.positionsSubject.asObservable();

  private tradesSubject = new BehaviorSubject<PositionView[]>([]);
  readonly trades$ = this.tradesSubject.asObservable();

  private marketDataSubject = new BehaviorSubject<MarketDataPoint[]>([]);
  readonly marketData$ = this.marketDataSubject.asObservable();

  private accountOverviewSubject = new BehaviorSubject<AccountOverview>({
    equity: 0,
    usedMargin: 0,
    freeMargin: 0,
    dailyPnl: 0,
    monthlyPnl: 0,
    unrealizedPnl: 0,
    drawdown: 0,
    totalCapital: 0,
    mode: 'PAPER'
  });
  readonly accountOverview$ = this.accountOverviewSubject.asObservable();

  private strategyHealthSubject = new BehaviorSubject<StrategyHealth>({
    status: 'OK',
    reasons: [],
    updatedAt: 'N/A',
    isPaused: false,
    canManage: true
  });
  readonly strategyHealth$ = this.strategyHealthSubject.asObservable();

  private riskSummarySubject = new BehaviorSubject<RiskSummary>({
    dailyLossLimit: 0,
    dailyLossUsed: 0,
    bufferRemaining: 0,
    maxDrawdown: 0,
    portfolioHeat: 0,
    circuitStatus: 'SAFE'
  });
  readonly riskSummary$ = this.riskSummarySubject.asObservable();

  private alertsSubject = new BehaviorSubject<AlertEvent[]>([]);
  readonly alerts$ = this.alertsSubject.asObservable();

  private lastUpdateSubject = new BehaviorSubject<string>('N/A');
  readonly lastUpdate$ = this.lastUpdateSubject.asObservable();

  private dashboardLoadingSubject = new BehaviorSubject<boolean>(true);
  readonly dashboardLoading$ = this.dashboardLoadingSubject.asObservable();

  private dashboardErrorSubject = new BehaviorSubject<string | null>(null);
  readonly dashboardError$ = this.dashboardErrorSubject.asObservable();

  private signalsSubject = new BehaviorSubject<Signal[]>([]);
  readonly signals$ = this.signalsSubject.asObservable();

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private settingsService: SettingsService,
    private riskService: RiskService,
    private modeStore: ModeStore,
    private toastService: ToastService
  ) {
    this.modeStore.mode$
      .pipe(
        distinctUntilChanged(),
        switchMap((mode) => this.refreshSnapshot(mode))
      )
      .subscribe();
  }

  setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatusSubject.next(status);
  }

  updateBotStatus(next: Partial<BotStatusState>) {
    const current = this.botStatusSubject.value;
    this.botStatusSubject.next({ ...current, ...next });
  }

  setPositions(positions: PositionView[]) {
    this.positionsSubject.next(positions);
  }

  setTrades(trades: PositionView[]) {
    this.tradesSubject.next(trades);
  }

  setMarketData(data: MarketDataPoint[]) {
    this.marketDataSubject.next(data);
  }

  setAccountOverview(next: Partial<AccountOverview>) {
    const current = this.accountOverviewSubject.value;
    this.accountOverviewSubject.next({ ...current, ...next });
  }

  setStrategyHealth(next: Partial<StrategyHealth>) {
    const current = this.strategyHealthSubject.value;
    this.strategyHealthSubject.next({ ...current, ...next });
  }

  setRiskSummary(next: Partial<RiskSummary>) {
    const current = this.riskSummarySubject.value;
    this.riskSummarySubject.next({ ...current, ...next });
  }

  setSignals(signals: Signal[]) {
    this.signalsSubject.next(signals);
  }

  addAlert(event: Omit<AlertEvent, 'id'>) {
    const next: AlertEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...event
    };
    this.alertsSubject.next([next, ...this.alertsSubject.value].slice(0, 50));
  }

  setDashboardError(message: string | null) {
    this.dashboardErrorSubject.next(message);
  }

  setLastUpdate(timestamp: string) {
    this.lastUpdateSubject.next(timestamp);
  }

  refreshSnapshot(mode: TradingMode): Observable<void> {
    this.dashboardLoadingSubject.next(true);
    this.dashboardErrorSubject.next(null);

    return forkJoin({
      summary: this.dashboardService.getSummary(),
      today: this.dashboardService.getTodayPnL(),
      unrealized: this.dashboardService.getUnrealizedPnL(),
      metrics: this.dashboardService.getPerformanceMetrics(),
      equity: this.dashboardService.getEquityCurve(mode),
      signals: this.dashboardService.getSignals(),
      positions: this.positionService.getOpenPositions(),
      trades: this.positionService.getClosedPositions(),
      settings: this.settingsService.loadSettings().pipe(catchError(() => of(null))),
      circuit: this.riskService.getCircuitBreakerStatus().pipe(catchError(() => of(null)))
    }).pipe(
      tap(({ summary, today, unrealized, metrics, equity, signals, positions, trades, settings, circuit }) => {
        const summaryPayload = summary as AccountOverviewDTO;
        const todayMetrics = today as PnLMetrics;
        const unrealizedMetrics = unrealized as PnLMetrics;
        const totalCapital =
          summaryPayload.availableFunds ??
          summaryPayload.availablePaperFunds ??
          summaryPayload.availableRealFunds ??
          summaryPayload.currentValue ??
          0;
        const circuitStatus = (circuit as CircuitBreakerStatus | null) ?? null;
        const dailyLossLimit = settings?.riskLimits?.maxDailyLossPercent && totalCapital
          ? (settings.riskLimits.maxDailyLossPercent / 100) * totalCapital
          : 0;

        this.setAccountOverview({
          equity: summaryPayload.currentValue ?? 0,
          usedMargin: summaryPayload.marginUsed ?? summaryPayload.equityUsed ?? 0,
          freeMargin: summaryPayload.availableFunds ?? summaryPayload.availablePaperFunds ?? 0,
          dailyPnl: todayMetrics?.todayPnL ?? summaryPayload.todaysPnl ?? 0,
          monthlyPnl: metrics?.netProfit ?? 0,
          unrealizedPnl: unrealizedMetrics?.unrealizedPnL ?? summaryPayload.unrealizedPnL ?? 0,
          drawdown: metrics?.maxDrawdown ?? 0,
          totalCapital,
          mode
        });

        this.setRiskSummary({
          dailyLossLimit: dailyLossLimit || 0,
          dailyLossUsed: circuitStatus?.dailyLossUsed ?? 0,
          bufferRemaining: dailyLossLimit ? Math.max(0, dailyLossLimit - Math.abs(circuitStatus?.dailyLossUsed ?? 0)) : 0,
          maxDrawdown: metrics?.maxDrawdown ?? 0,
          portfolioHeat: circuitStatus?.portfolioHeat ?? 0,
          circuitStatus: circuitStatus?.triggered ? 'TRIGGERED' : 'SAFE'
        });

        const strategyStatus: StrategyHealthStatus = circuitStatus?.triggered
          ? 'BROKEN'
          : metrics?.maxDrawdown && metrics.maxDrawdown > 20
          ? 'DEGRADED'
          : 'OK';

        this.setStrategyHealth({
          status: strategyStatus,
          reasons: circuitStatus?.triggered
            ? [circuitStatus.reason ?? 'Risk circuit breaker triggered']
            : metrics?.maxDrawdown && metrics.maxDrawdown > 20
            ? ['Drawdown exceeds 20%', 'Volatility elevated beyond guardrails']
            : ['Execution within risk guardrails'],
          updatedAt: new Date().toLocaleTimeString(),
          isPaused: circuitStatus?.triggered ?? false,
          canManage: true
        });

        this.updateBotStatus({
          lastScan: signals?.[0]?.scanTime ? new Date(signals[0].scanTime).toLocaleString() : 'N/A',
          nextScan: summaryPayload.nextScanTime ?? 'N/A',
          signalsFound: signals?.length ?? 0
        });

        this.setPositions(positions ?? []);
        this.setTrades(trades ?? []);
        this.setSignals(signals ?? []);
        const equityCurve = Array.isArray(equity) ? equity : equity?.curve ?? [];
        this.setMarketData(equityCurve);
        this.setLastUpdate(new Date().toLocaleTimeString());
        this.dashboardLoadingSubject.next(false);
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('Failed to load dashboard snapshot', error);
        this.dashboardLoadingSubject.next(false);
        this.dashboardErrorSubject.next('Unable to load trading dashboard. Please retry.');
        this.toastService.showError('Dashboard data unavailable.');
        return of(undefined);
      })
    );
  }

  handleWebsocketMessage(type: string, data: unknown) {
    switch (type) {
      case 'market-data':
        this.setMarketData(Array.isArray(data) ? (data as MarketDataPoint[]) : []);
        break;
      case 'positions':
        this.setPositions(Array.isArray(data) ? (data as PositionView[]) : []);
        break;
      case 'trades':
        this.setTrades(Array.isArray(data) ? (data as PositionView[]) : []);
        break;
      case 'bot-status':
        this.updateBotStatus({
          state: (data as { state?: string; status?: string } | null)?.state ??
            (data as { status?: string } | null)?.status ??
            'RUNNING',
          isPaused: (data as { isPaused?: boolean; paused?: boolean } | null)?.isPaused ??
            (data as { paused?: boolean } | null)?.paused ??
            false,
          lastScan: (data as { lastScan?: string; lastScanTime?: string } | null)?.lastScan ??
            (data as { lastScanTime?: string } | null)?.lastScanTime ??
            this.botStatusSubject.value.lastScan,
          nextScan: (data as { nextScan?: string; nextScanTime?: string } | null)?.nextScan ??
            (data as { nextScanTime?: string } | null)?.nextScanTime ??
            this.botStatusSubject.value.nextScan,
          signalsFound: (data as { signalsFound?: number } | null)?.signalsFound ?? this.botStatusSubject.value.signalsFound
        });
        break;
      case 'alerts':
        if ((data as { message?: string } | null)?.message) {
          this.addAlert({
            type: (data as { type?: 'info' | 'warning' | 'error' } | null)?.type ?? 'info',
            message: (data as { message: string }).message,
            timestamp: (data as { timestamp?: string } | null)?.timestamp ?? new Date().toISOString()
          });
        }
        break;
      default:
        break;
    }
    this.setLastUpdate(new Date().toLocaleTimeString());
  }
}
