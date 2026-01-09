import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreService } from './store.service';

export type TradingMode = 'LIVE' | 'PAPER';

@Injectable({ providedIn: 'root' })
export class TradingModeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private store: StoreService
  ) {}

  syncModeFromBackend(): Observable<TradingMode> {
    return this.getMode().pipe(tap((mode) => this.updateStoreMode(mode)));
  }

  getMode(): Observable<TradingMode> {
    return this.http.get<{ mode: TradingMode }>(`${this.apiUrl}/strategy/mode`).pipe(
      map((response) => response.mode)
    );
  }

  setMode(mode: TradingMode): Observable<TradingMode> {
    return this.http.post(`${this.apiUrl}/strategy/mode?mode=${mode}`, {}).pipe(
      map(() => mode),
      tap((nextMode) => this.updateStoreMode(nextMode))
    );
  }

  private updateStoreMode(mode: TradingMode): void {
    this.store.setMode(mode === 'LIVE');
  }
}
