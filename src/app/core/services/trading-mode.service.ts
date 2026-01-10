import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TradingMode = 'LIVE' | 'PAPER';

@Injectable({ providedIn: 'root' })
export class TradingModeService {
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  getMode(): Observable<TradingMode> {
    return this.http.get<{ mode: TradingMode }>(`${this.apiUrl}/strategy/mode`).pipe(
      map((response) => response.mode)
    );
  }

  setMode(mode: TradingMode): Observable<TradingMode> {
    return this.http.post(`${this.apiUrl}/strategy/mode?mode=${mode}`, {}).pipe(
      map(() => mode)
    );
  }
}
