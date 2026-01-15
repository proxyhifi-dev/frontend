import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PerformanceMetrics, Signal } from '../models/domain.model';
import { AccountOverviewDTO } from '../models/account.dto';
import { EquityCurvePoint } from '../models/market-data.model';
import { PnLMetrics } from '../models/pnl-metrics.dto';
import { HttpBaseService } from '../http/http-base.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpBaseService) {}

  getSummary(): Observable<AccountOverviewDTO> {
    return this.http.get<AccountOverviewDTO>('/account/summary');
  }

  getOverview(): Observable<AccountOverviewDTO> {
    return this.http.get<AccountOverviewDTO>('/account/overview');
  }

  getTodayPnL(): Observable<PnLMetrics> {
    return this.http.get<PnLMetrics>('/performance/today-pnl');
  }

  getDailyPnL(): Observable<PnLMetrics> {
    return this.http.get<PnLMetrics>('/performance/daily-pnl');
  }

  getMonthlyPnL(): Observable<PnLMetrics> {
    return this.http.get<PnLMetrics>('/performance/monthly-pnl');
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>('/performance/metrics');
  }

  getEquityCurve(type: string = 'PAPER'): Observable<EquityCurvePoint[] | { curve: EquityCurvePoint[] }> {
    return this.http.get<EquityCurvePoint[] | { curve: EquityCurvePoint[] }>(
      `/performance/equity-curve?type=${type}`
    );
  }

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>('/strategy/signals/recent');
  }
}
