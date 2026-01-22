import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, throwError, forkJoin, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface TradingSettings {
  mode: 'LIVE' | 'PAPER';
  maxPositions: number;
  riskLimits: {
    maxRiskPerTradePercent: number;
    maxDailyLossPercent: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly cacheKey = 'apex.settings';
  private readonly storageModeSubject = new BehaviorSubject<'remote' | 'local'>('remote');
  readonly storageMode$ = this.storageModeSubject.asObservable();

  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  loadSettings(): Observable<TradingSettings> {
    if (!this.hasRemoteSettings()) {
      this.storageModeSubject.next('local');
      return of(this.getLocalSettings());
    }

    const risk$ = this.runtimeConfig.hasEndpoint('/risk/limits')
      ? this.http.get<RiskLimitsResponse>('/risk/limits').pipe(catchError(() => of(null)))
      : of(null);
    const mode$ = this.runtimeConfig.hasEndpoint('/strategy/mode')
      ? this.http.get<{ mode?: string } | string>('/strategy/mode').pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin({ risk: risk$, mode: mode$ }).pipe(
      map(({ risk, mode }) => {
        const modeValue = typeof mode === 'string' ? mode : mode?.mode;
        return {
          mode: (modeValue as TradingSettings['mode']) ?? this.getLocalSettings().mode,
          maxPositions: risk?.maxPositions ?? this.getLocalSettings().maxPositions,
          riskLimits: {
            maxRiskPerTradePercent: risk?.maxRiskPerTradePercent ?? this.getLocalSettings().riskLimits.maxRiskPerTradePercent,
            maxDailyLossPercent: risk?.maxDailyLossPercent ?? this.getLocalSettings().riskLimits.maxDailyLossPercent
          }
        };
      }),
      tap((settings) => {
        sessionStorage.setItem(this.cacheKey, JSON.stringify(settings));
        this.storageModeSubject.next('remote');
      }),
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.storageModeSubject.next('local');
          return of(this.getLocalSettings());
        }
        return throwError(() => error);
      })
    );
  }

  saveSettings(settings: TradingSettings): Observable<TradingSettings> {
    if (this.storageModeSubject.value === 'local' || !this.hasRemoteSettings()) {
      this.storageModeSubject.next('local');
      this.saveLocalSettings(settings);
      return of(settings);
    }

    const requests: Observable<unknown>[] = [];
    if (this.runtimeConfig.hasEndpoint('/risk/limits')) {
      requests.push(this.http.put<RiskLimitsResponse>('/risk/limits', {
        maxRiskPerTradePercent: settings.riskLimits.maxRiskPerTradePercent,
        maxDailyLossPercent: settings.riskLimits.maxDailyLossPercent,
        maxPositions: settings.maxPositions
      }));
    }
    if (this.runtimeConfig.hasEndpoint('/strategy/mode')) {
      requests.push(this.http.post<void>('/strategy/mode', { mode: settings.mode }));
    }

    if (!requests.length) {
      this.storageModeSubject.next('local');
      this.saveLocalSettings(settings);
      return of(settings);
    }

    return forkJoin(requests).pipe(
      map(() => settings),
      tap((saved) => {
        this.saveLocalSettings(saved);
        this.storageModeSubject.next('remote');
      }),
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.storageModeSubject.next('local');
          this.saveLocalSettings(settings);
          return of(settings);
        }
        return throwError(() => error);
      })
    );
  }

  private saveLocalSettings(settings: TradingSettings): void {
    sessionStorage.setItem(this.cacheKey, JSON.stringify(settings));
  }

  private getLocalSettings(): TradingSettings {
    const stored = sessionStorage.getItem(this.cacheKey);
    if (stored) {
      try {
        return JSON.parse(stored) as TradingSettings;
      } catch {
        return this.defaultSettings();
      }
    }
    return this.defaultSettings();
  }

  private defaultSettings(): TradingSettings {
    return {
      mode: 'PAPER',
      maxPositions: 3,
      riskLimits: {
        maxRiskPerTradePercent: 1,
        maxDailyLossPercent: 5
      }
    };
  }

  private hasRemoteSettings(): boolean {
    return this.runtimeConfig.hasEndpoint('/risk/limits') || this.runtimeConfig.hasEndpoint('/strategy/mode');
  }
}

interface RiskLimitsResponse {
  maxRiskPerTradePercent?: number;
  maxDailyLossPercent?: number;
  maxPositions?: number;
}
