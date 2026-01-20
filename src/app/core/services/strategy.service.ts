import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, forkJoin } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { Signal } from '../models/domain.model';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { TokenService } from '../auth/token.service';

export interface StrategyConfig {
  name?: string;
  mode?: string;
  maxPositions?: number;
  scanIntervalSeconds?: number;
  riskPerTradePercent?: number;
  dailyLossLimitPercent?: number;
  universe?: string;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  constructor(
    private http: HttpBaseService,
    private runtimeConfig: RuntimeConfigService,
    private tokenService: TokenService
  ) {}

  /**
   * ✅ STRATEGY SIGNALS
   * Do NOT call backend unless authenticated
   */
  getSignals(): Observable<Signal[]> {
    if (!this.hasToken() || !this.runtimeConfig.hasEndpoint('/strategy/signals')) {
      return of([]);
    }

    return this.http.get<Signal[]>('/strategy/signals').pipe(
      catchError(() => of([]))
    );
  }

  /**
   * ✅ STRATEGY CONFIG
   */
  getConfig(): Observable<StrategyConfig> {
    if (!this.hasToken() || !this.runtimeConfig.hasEndpoint('/strategy/config')) {
      return of(this.defaultConfig());
    }

    return this.http.get<StrategyConfig>('/strategy/config').pipe(
      catchError(() => of(this.defaultConfig()))
    );
  }

  updateConfig(config: StrategyConfig): Observable<StrategyConfig> {
    if (!this.hasToken()) {
      return of(this.defaultConfig());
    }

    return this.http.post<StrategyConfig>('/strategy/config', config).pipe(
      catchError(() => of(this.defaultConfig()))
    );
  }

  /**
   * ✅ Optional combined load (safe)
   */
  loadAll(): Observable<{ signals: Signal[]; config: StrategyConfig }> {
    if (!this.hasToken()) {
      return of({
        signals: [],
        config: this.defaultConfig()
      });
    }

    return forkJoin({
      signals: this.getSignals(),
      config: this.getConfig()
    });
  }

  // ------------------------
  // Helpers
  // ------------------------

  private hasToken(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  private defaultConfig(): StrategyConfig {
    return {
      name: 'Strategy',
      mode: 'PAPER',
      maxPositions: 0,
      scanIntervalSeconds: 0,
      riskPerTradePercent: 0,
      dailyLossLimitPercent: 0,
      universe: 'Pending backend data'
    };
  }
}
