import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/account/summary`);
  }

  // Existing methods
  getTodayPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/today-pnl`);
  }

  getUnrealizedPnL(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/unrealized-pnl`);
  }

  getPerformanceMetrics(): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`${this.apiUrl}/performance/metrics`);
  }

  getEquityCurve(type: string = 'PAPER'): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/performance/equity-curve?type=${type}`);
  }

  getSignals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/strategy/signals`);
  }
}
