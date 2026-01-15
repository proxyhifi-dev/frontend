import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { Signal } from '../models/domain.model';

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
  constructor(private http: HttpBaseService) {}

  getConfig(): Observable<StrategyConfig> {
    return this.http.get<StrategyStatusResponse>('/strategy/status').pipe(
      map((status) => ({
        name: status.name ?? status.status ?? 'Strategy',
        mode: status.mode ?? 'PAPER',
        maxPositions: undefined,
        scanIntervalSeconds: status.scanIntervalSeconds,
        riskPerTradePercent: status.riskPerTradePercent,
        dailyLossLimitPercent: status.dailyLossLimitPercent,
        universe: status.universe
      })),
      catchError(() => of(this.defaultConfig()))
    );
  }

  getRegime(): Observable<RegimeStatus> {
    return this.http.get<StrategyStatusResponse>('/strategy/status').pipe(
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
    return this.http.get<Signal[]>('/strategy/signals/recent').pipe(
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
