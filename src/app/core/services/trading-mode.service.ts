import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SettingsService, TradingSettings } from './settings.service';
import { StoreService } from './store.service';

export type TradingMode = 'LIVE' | 'PAPER';

@Injectable({ providedIn: 'root' })
export class TradingModeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
    private store: StoreService
  ) {}

  syncModeFromBackend(): Observable<TradingMode> {
    return this.settingsService.loadSettings().pipe(
      map((settings: TradingSettings) => settings.mode),
      tap((mode) => this.updateStoreMode(mode)),
      catchError(() =>
        this.http.get<{ paperMode: boolean }>(`${this.apiUrl}/strategy/mode`).pipe(
          map((response) => (response.paperMode ? 'PAPER' : 'LIVE') as TradingMode),
          tap((mode) => this.updateStoreMode(mode))
        )
      )
    );
  }

  setMode(isLiveMode: boolean): Observable<void> {
    return this.http.post(`${this.apiUrl}/strategy/mode?paperMode=${!isLiveMode}`, {}).pipe(
      tap(() => {
        this.store.setMode(isLiveMode);
      }),
      map(() => undefined)
    );
  }

  private updateStoreMode(mode: TradingMode): void {
    this.store.setMode(mode === 'LIVE');
  }
}
