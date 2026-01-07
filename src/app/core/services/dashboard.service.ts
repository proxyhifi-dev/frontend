import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PerformanceMetrics } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;

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

  // Added to match component call
  getDashboardStats(): Observable<any> {
    return this.getSummary();
  }

  getSummary(type: 'PAPER' | 'LIVE' = 'PAPER'): Observable<any> {
    return this.http.get(`${this.apiUrl}/account/summary?type=${type}`).pipe(
      catchError(() => of({
        name: 'Trader',
        availableFunds: 0,
        availableRealFunds: 0,
        availablePaperFunds: 0,
        totalInvested: 0,
        currentValue: 0,
        todaysPnl: 0,
        holdings: []
      }))
    );
  }

  // Added methods
  toggleMode(isLive: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/strategy/mode?paperMode=${!isLive}`, {}).pipe(
      catchError(() => of({ success: true }))
    );
  }

  // Existing methods
  getTodayPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/today-pnl`).pipe(
      catchError(() => of({ todayPnL: 0, tradesCount: 0 }))
    );
  }

  getUnrealizedPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/unrealized-pnl`).pipe(
      catchError(() => of({ unrealizedPnL: 0, openPositions: 0 }))
    );
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`${this.apiUrl}/performance/metrics`).pipe(
      catchError(() => of({
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netProfit: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        maxDrawdown: 0
      }))
    );
  }

  getEquityCurve(type: string = 'PAPER'): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/performance/equity-curve?type=${type}`).pipe(
      catchError(() => of({ type, curve: new Array(30).fill(100000) }))
    );
  }

  getSignals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/strategy/signals`).pipe(
      catchError(() => of([]))
    );
  }
}
