import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { TokenService } from '../auth/token.service';

/**
 * UI expects these exports (StrategyComponent imports them).
 */
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
  regime: string;
  confidence: number;
  lastUpdated?: string | Date;
  notes?: string;
}

/**
 * StrategyComponent table expects fields:
 * symbol OR signalId, decision, score, reason
 */
export interface ScoringSummary {
  symbol?: string;
  signalId?: string | number;
  decision?: string;
  score?: number;
  reason?: string;
}

/**
 * Backend DTO (from /api/strategy/health)
 * record StrategyHealthResponse(String status, boolean paused, List<String> reasons)
 */
interface StrategyHealthResponse {
  status?: string;
  paused?: boolean;
  reasons?: string[];
}

/**
 * Backend DTO (from /api/strategy/signals)
 */
interface SignalDTO {
  id?: number;
  symbol?: string;
  signalScore?: number;
  grade?: string;
  hasEntrySignal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  constructor(
    private http: HttpBaseService,
    private runtimeConfig: RuntimeConfigService,
    private tokenService: TokenService
  ) {}

  /**
   * ✅ Strategy config
   * Your backend currently does NOT expose /strategy/config,
   * so return a safe default (UI renders fine).
   *
   * If you later add /strategy/config in backend, we can wire it here.
   */
  getConfig(): Observable<StrategyConfig> {
    // don’t block UI when logged out
    if (!this.hasToken()) return of(this.defaultConfig());

    // If you add a real endpoint later, change this to call it
    return of(this.defaultConfig());
  }

  /**
   * ✅ Regime status used by StrategyComponent
   * Uses /strategy/health (exists in your backend).
   */
  getRegime(): Observable<RegimeStatus> {
    if (!this.hasToken()) return of(this.fallbackRegime('Not logged in'));

    if (!this.runtimeConfig.hasEndpoint('/strategy/health')) {
      return of(this.fallbackRegime('Strategy health unavailable for this backend.'));
    }

    return this.http.get<StrategyHealthResponse>('/strategy/health').pipe(
      map((health) => {
        const paused = !!health?.paused;
        const status = (health?.status || 'Unknown').toString();

        return {
          regime: paused ? 'Paused' : status,
          confidence: paused ? 0 : 50, // backend doesn’t provide confidence; UI needs a number
          lastUpdated: new Date(),
          notes: Array.isArray(health?.reasons) && health!.reasons!.length
            ? health!.reasons!.join(' • ')
            : undefined
        } as RegimeStatus;
      }),
      catchError(() => of(this.fallbackRegime('Unable to load strategy health.')))
    );
  }

  /**
   * ✅ Scoring breakdown used by StrategyComponent
   * Your backend exposes /strategy/signals and /strategy/signals/pending.
   * We’ll use /strategy/signals if available, else pending, else fallback [].
   */
  getScoringSummary(): Observable<ScoringSummary[]> {
    if (!this.hasToken()) return of([]);

    const hasSignals = this.runtimeConfig.hasEndpoint('/strategy/signals');
    const hasPending = this.runtimeConfig.hasEndpoint('/strategy/signals/pending');

    if (!hasSignals && !hasPending) return of([]);

    const endpoint = hasSignals ? '/strategy/signals' : '/strategy/signals/pending';

    return this.http.get<SignalDTO[]>(endpoint).pipe(
      map((signals) => {
        if (!Array.isArray(signals)) return [];

        return signals.map((s) => ({
          symbol: s.symbol,
          signalId: s.id,
          decision: s.grade ?? (s.hasEntrySignal ? 'ENTRY' : '—'),
          score: typeof s.signalScore === 'number' ? s.signalScore : undefined,
          reason: s.grade ? `Grade: ${s.grade}` : ''
        })) as ScoringSummary[];
      }),
      catchError(() => of([]))
    );
  }

  // ------------------------
  // Helpers
  // ------------------------

  private hasToken(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  private fallbackRegime(notes: string): RegimeStatus {
    return {
      regime: 'Unknown',
      confidence: 0,
      lastUpdated: undefined,
      notes
    };
  }

  private defaultConfig(): StrategyConfig {
    return {
      name: 'Strategy',
      mode: 'PAPER',
      maxPositions: 0,
      scanIntervalSeconds: 0,
      riskPerTradePercent: 0,
      dailyLossLimitPercent: 0,
      universe: '—'
    };
  }
}
