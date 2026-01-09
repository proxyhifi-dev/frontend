import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/settings`;
  private readonly cacheKey = 'apex.settings';

  constructor(private http: HttpClient) {}

  loadSettings(): Observable<TradingSettings> {
    return this.http.get<TradingSettings>(this.apiUrl).pipe(
      tap((settings) => {
        if (settings) {
          localStorage.setItem(this.cacheKey, JSON.stringify(settings));
        }
      })
    );
  }

  saveSettings(settings: TradingSettings): Observable<TradingSettings> {
    return this.http.put<TradingSettings>(this.apiUrl, settings).pipe(
      tap((saved) => {
        if (saved) {
          localStorage.setItem(this.cacheKey, JSON.stringify(saved));
        }
      })
    );
  }
}
