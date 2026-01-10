import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerformanceMetrics, Signal } from '../models/domain.model';
import { AccountOverviewDTO } from '../models/account.dto';
import { EquityCurvePoint } from '../models/market-data.model';
import { PnLMetrics } from '../models/pnl-metrics.dto';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;

  private summarySubject = new BehaviorSubject<AccountOverviewDTO>({
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    roi: 0,
    totalCapital: 100000,
    totalTrades: 0
  });

  public summary$ = this.summarySubject.asObservable();

  constructor(private http: HttpClient) {}

  // Added to match component call
  getDashboardStats(): Observable<AccountOverviewDTO> {
    return this.getSummary();
  }

  getSummary(): Observable<AccountOverviewDTO> {
    return this.http.get<AccountOverviewDTO>(`${this.apiUrl}/account/summary`);
  }

  // Existing methods
  getTodayPnL(): Observable<PnLMetrics> {
    return this.http.get<PnLMetrics>(`${this.apiUrl}/performance/today-pnl`);
  }

  getUnrealizedPnL(): Observable<PnLMetrics> {
    return this.http.get<PnLMetrics>(`${this.apiUrl}/performance/unrealized-pnl`);
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`${this.apiUrl}/performance/metrics`);
  }

  getEquityCurve(type: string = 'PAPER'): Observable<EquityCurvePoint[] | { curve: EquityCurvePoint[] }> {
    return this.http.get<EquityCurvePoint[] | { curve: EquityCurvePoint[] }>(
      `${this.apiUrl}/performance/equity-curve?type=${type}`
    );
  }

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>(`${this.apiUrl}/strategy/signals`);
  }
}
