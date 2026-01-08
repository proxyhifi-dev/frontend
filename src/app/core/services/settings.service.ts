import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TradingSettings {
  mode: 'paper' | 'live';
  risk: { perTrade: number; dailyLimit: number; weeklyLimit: number };
  trading: { maxPositions: number; sectorLimit: number; correlation: number };
  api: { appId: string };
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly apiUrl = `${environment.apiUrl}/settings`;
  private readonly cacheKey = 'apex.settings';

  constructor(private http: HttpClient) {}

  loadSettings(): Observable<TradingSettings> {
    return this.http.get<TradingSettings>(this.apiUrl).pipe(
      tap(settings => {
        if (settings) {
          localStorage.setItem(this.cacheKey, JSON.stringify(settings));
        }
      }),
      catchError(() => {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
          return of(JSON.parse(cached) as TradingSettings);
        }
        return of<TradingSettings>({
          mode: 'paper',
          risk: { perTrade: 1.0, dailyLimit: 5, weeklyLimit: 10 },
          trading: { maxPositions: 3, sectorLimit: 2, correlation: 0.7 },
          api: { appId: '' }
        });
      })
    );
  }

  saveSettings(settings: TradingSettings): Observable<TradingSettings> {
    return this.http.post<TradingSettings>(this.apiUrl, settings).pipe(
      tap(saved => {
        localStorage.setItem(this.cacheKey, JSON.stringify(saved));
      }),
      catchError(() => {
        localStorage.setItem(this.cacheKey, JSON.stringify(settings));
        return of<TradingSettings>(settings);
      })
    );
  }
}
