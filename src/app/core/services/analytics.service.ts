import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PerformanceMetrics } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getMetrics(range: string = '30d'): Observable<PerformanceMetrics> {
    if (!this.runtimeConfig.hasEndpoint('/performance/metrics')) {
      return of({
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        netProfit: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0
      });
    }
    return this.http.get<PerformanceMetrics>(`/performance/metrics?range=${range}`);
  }
}
