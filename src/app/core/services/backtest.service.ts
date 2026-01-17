import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ApiError } from '../models/api-error.model';

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
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getRuns(): Observable<BacktestRun[]> {
    if (!this.runtimeConfig.hasEndpoint('/backtest/runs')) {
      return of([]);
    }
    return this.http.get<BacktestRun[]>('/backtest/runs');
  }

  runBacktest(payload: Record<string, unknown>): Observable<BacktestRun> {
    if (!this.runtimeConfig.hasEndpoint('/backtest/run')) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Backtesting endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.post<BacktestRun>('/backtest/run', payload);
  }

  getRunDetail(id: string | number): Observable<BacktestDetail> {
    if (!this.runtimeConfig.hasEndpoint('/backtest/runs/{id}')) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Backtesting endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.get<BacktestDetail>(`/backtest/runs/${id}`);
  }
}
