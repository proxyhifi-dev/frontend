import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, throwError } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';

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

  constructor(private http: HttpBaseService) {}

  loadSettings(): Observable<TradingSettings> {
    return this.http.get<TradingSettings>('/settings').pipe(
      tap((settings) => {
        if (settings) {
          localStorage.setItem(this.cacheKey, JSON.stringify(settings));
          this.storageModeSubject.next('remote');
        }
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
    if (this.storageModeSubject.value === 'local') {
      this.saveLocalSettings(settings);
      return of(settings);
    }

    return this.http.put<TradingSettings>('/settings', settings).pipe(
      tap((saved) => {
        if (saved) {
          this.saveLocalSettings(saved);
          this.storageModeSubject.next('remote');
        }
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
    localStorage.setItem(this.cacheKey, JSON.stringify(settings));
  }

  private getLocalSettings(): TradingSettings {
    const stored = localStorage.getItem(this.cacheKey);
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
}
