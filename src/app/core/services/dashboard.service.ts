import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PerformanceMetrics, Signal } from '../models/domain.model';
import { AccountOverviewDTO } from '../models/account.dto';
import { EquityCurvePoint } from '../models/market-data.model';
import { PnLMetrics } from '../models/pnl-metrics.dto';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getSummary(): Observable<AccountOverviewDTO> {
    return this.optionalGet<AccountOverviewDTO>('/account/summary', {});
  }

  getOverview(): Observable<AccountOverviewDTO> {
    return this.optionalGet<AccountOverviewDTO>('/account/overview', {});
  }

  getTodayPnL(): Observable<PnLMetrics> {
    return this.optionalGet<PnLMetrics>('/performance/today-pnl', {});
  }

  getDailyPnL(): Observable<PnLMetrics> {
    return this.optionalGet<PnLMetrics>('/performance/daily-pnl', {});
  }

  getMonthlyPnL(): Observable<PnLMetrics> {
    return this.optionalGet<PnLMetrics>('/performance/monthly-pnl', {});
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.optionalGet<PerformanceMetrics>('/performance/metrics', this.defaultMetrics());
  }

  getEquityCurve(type: string = 'PAPER'): Observable<EquityCurvePoint[] | { curve: EquityCurvePoint[] }> {
    if (!this.runtimeConfig.hasEndpoint('/performance/equity-curve')) {
      return of([]);
    }
    return this.http.get<EquityCurvePoint[] | { curve: EquityCurvePoint[] }>(`/performance/equity-curve?type=${type}`);
  }

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>('/strategy/signals');
  }

  private optionalGet<T>(path: string, fallback: T): Observable<T> {
    if (!this.runtimeConfig.hasEndpoint(path)) {
      return of(fallback);
    }
    return this.http.get<T>(path);
  }

  private defaultMetrics(): PerformanceMetrics {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      netProfit: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0
    };
  }
}
