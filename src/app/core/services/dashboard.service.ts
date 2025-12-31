import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;
  
  // ✅ Real-time data subjects
  private summarySubject = new BehaviorSubject<any>({
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    roi: 0,
    totalCapital: 100000,
    totalTrades: 0
  });
  
  public summary$ = this.summarySubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get complete summary with all metrics
   */
  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/account/summary?type=PAPER`).pipe(
      catchError(() => of({
        todayPnL: 0,
        unrealizedPnL: 0,
        winRate: 0,
        roi: 0,
        totalCapital: 100000,
        totalTrades: 0
      }))
    );
  }

  /**
   * Get today's P&L
   */
  getTodayPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/today-pnl`).pipe(
      catchError(() => of({ todayPnL: 0, tradesCount: 0 }))
    );
  }

  /**
   * Get unrealized P&L (open positions)
   */
  getUnrealizedPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/unrealized-pnl`).pipe(
      catchError(() => of({ unrealizedPnL: 0, openPositions: 0 }))
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/metrics`).pipe(
      catchError(() => of({
        totalTrades: 0,
        winRate: 0,
        netProfit: 0,
        profitFactor: 0,
        maxDrawdown: 0
      }))
    );
  }

  /**
   * Get win rate
   */
  getWinRate(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/win-rate`).pipe(
      catchError(() => of({ metric: 'Win Rate', value: 0 }))
    );
  }

  /**
   * Get ROI
   */
  getROI(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/roi`).pipe(
      catchError(() => of({ metric: 'ROI', value: 0 }))
    );
  }

  /**
   * Get max drawdown
   */
  getMaxDrawdown(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/max-drawdown`).pipe(
      catchError(() => of({ metric: 'Max Drawdown', value: 0 }))
    );
  }

  /**
   * Get profit factor
   */
  getProfitFactor(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/profit-factor`).pipe(
      catchError(() => of({ metric: 'Profit Factor', value: 0 }))
    );
  }

  /**
   * Get Sharpe ratio
   */
  getSharpeRatio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/sharpe-ratio`).pipe(
      catchError(() => of({ metric: 'Sharpe Ratio', value: 0 }))
    );
  }

  /**
   * Get equity curve data
   */
  getEquityCurve(type: string = 'PAPER'): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/performance/equity-curve?type=${type}`).pipe(
      catchError(() => of({ type, curve: new Array(30).fill(100000) }))
    );
  }

  /**
   * Get signals
   */
  getSignals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/strategy/signals`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Update summary data
   */
  updateSummary(data: any): void {
    this.summarySubject.next(data);
  }
}
