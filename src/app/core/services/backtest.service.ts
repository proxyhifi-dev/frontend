import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BacktestRun {
  id: string | number;
  strategy?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  parameters?: Record<string, unknown>;
}

export interface BacktestMetrics {
  netProfit?: number;
  totalTrades?: number;
  winRate?: number;
  profitFactor?: number;
  maxDrawdown?: number;
  expectancy?: number;
  averageWin?: number;
  averageLoss?: number;
}

export interface BacktestMonthlyBreakdown {
  month: string;
  netProfit?: number;
  totalTrades?: number;
  winRate?: number;
  maxDrawdown?: number;
  rMultiple?: number;
}

export interface BacktestDetail {
  run: BacktestRun;
  metrics?: BacktestMetrics;
  monthly?: BacktestMonthlyBreakdown[];

  // Backwards-compatible flattened fields used by some UI components.
  profit?: number;
  profitFactor?: number;
  maxDrawdown?: number;
  trades?: unknown[];
}

@Injectable({ providedIn: 'root' })
export class BacktestService {
  private readonly apiUrl = `${environment.apiUrl}/backtest`;

  constructor(private http: HttpClient) {}

  getRuns(): Observable<BacktestRun[]> {
    return this.http.get<BacktestRun[]>(`${this.apiUrl}/runs`);
  }

  runBacktest(payload: Record<string, unknown>): Observable<BacktestRun> {
    return this.http.post<BacktestRun>(`${this.apiUrl}/run`, payload);
  }

  getRunDetail(id: string | number): Observable<BacktestDetail> {
    return this.http.get<BacktestDetail>(`${this.apiUrl}/runs/${id}`);
  }
}
