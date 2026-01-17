import { Injectable } from '@angular/core';
import { Observable, of, catchError, map, forkJoin } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { Signal } from '../models/domain.model';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface StrategyConfig {
  name?: string;
  mode?: string;
  maxPositions?: number;
  scanIntervalSeconds?: number;
  riskPerTradePercent?: number;
  dailyLossLimitPercent?: number;
  universe?: string;
}

export interface RegimeStatus {
  regime?: string;
  confidence?: number;
  lastUpdated?: string;
  notes?: string;
}

export interface ScoringSummary {
  signalId?: number;
  symbol?: string;
  decision?: string;
  reason?: string;
  score?: number;
}

interface StrategyStatusResponse {
  name?: string;
  mode?: string;
  status?: string;
  scanIntervalSeconds?: number;
  riskPerTradePercent?: number;
  dailyLossLimitPercent?: number;
  regime?: string;
  regimeConfidence?: number;
  regimeNotes?: string;
  universe?: string;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getConfig(): Observable<StrategyConfig> {
    const health$ = this.runtimeConfig.hasEndpoint('/strategy/health')
      ? this.http.get<StrategyStatusResponse>('/strategy/health').pipe(catchError(() => of(null)))
      : of(null);
    const mode$ = this.runtimeConfig.hasEndpoint('/strategy/mode')
      ? this.http.get<{ mode?: string } | string>('/strategy/mode').pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin({ health: health$, mode: mode$ }).pipe(
      map(({ health, mode }) => {
        const modeValue = typeof mode === 'string' ? mode : mode?.mode;
        return {
          name: health?.name ?? health?.status ?? 'Strategy',
          mode: modeValue ?? health?.mode ?? 'PAPER',
          maxPositions: undefined,
          scanIntervalSeconds: health?.scanIntervalSeconds,
          riskPerTradePercent: health?.riskPerTradePercent,
          dailyLossLimitPercent: health?.dailyLossLimitPercent,
          universe: health?.universe
        };
      }),
      catchError(() => of(this.defaultConfig()))
    );
  }

  getRegime(): Observable<RegimeStatus> {
    if (!this.runtimeConfig.hasEndpoint('/strategy/health')) {
      return of({ regime: 'Unknown', confidence: 0, lastUpdated: 'N/A', notes: 'Backend pending' });
    }

    return this.http.get<StrategyStatusResponse>('/strategy/health').pipe(
      map((status) => ({
        regime: status.regime ?? 'Unknown',
        confidence: status.regimeConfidence,
        lastUpdated: new Date().toISOString(),
        notes: status.regimeNotes
      })),
      catchError(() => of({ regime: 'Unknown', confidence: 0, lastUpdated: 'N/A', notes: 'Backend pending' }))
    );
  }

  getScoringSummary(): Observable<ScoringSummary[]> {
    return this.http.get<Signal[]>('/strategy/signals').pipe(
      map((signals) =>
        signals.map((signal) => ({
          signalId: signal.id,
          symbol: signal.symbol,
          decision: signal.hasEntrySignal ? 'ENTRY READY' : 'MONITOR',
          reason: signal.grade,
          score: signal.signalScore
        }))
      ),
      catchError(() => of([]))
    );
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
