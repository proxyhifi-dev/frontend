import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, tap } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';
import { TokenService } from '../auth/token.service';

export type TradingMode = 'LIVE' | 'PAPER';

/**
 * Backend shape:
 * GET  /api/strategy/mode  -> { mode: "PAPER" }
 * POST /api/strategy/mode?mode=PAPER|LIVE  -> { mode: "PAPER" }  (or similar)
 */
type TradingModeResponse = { mode: TradingMode };

@Injectable({ providedIn: 'root' })
export class TradingModeService {
  private readonly storageKey = 'tradingMode';
  private modeSupportedSubject = new BehaviorSubject<boolean>(true);
  readonly modeSupported$ = this.modeSupportedSubject.asObservable();

  constructor(
    private http: HttpBaseService,
    private tokenService: TokenService
  ) {}

  /**
   * ✅ Do not hit backend unless logged in
   * ✅ Parse backend response object safely
   */
  getMode(): Observable<TradingMode> {
    if (!this.hasToken()) {
      return of(this.getLocalMode());
    }

    return this.http.get<TradingModeResponse>('/strategy/mode').pipe(
      map((res) => this.normalizeMode(res)),
      tap((mode) => this.setLocalMode(mode)),
      catchError((err: ApiError) => {
        this.modeSupportedSubject.next(false);
        return of(this.getLocalMode());
      })
    );
  }

  /**
   * ✅ Safe mode switch
   * ✅ Backend expects query param (not JSON body)
   */
  setMode(mode: TradingMode): Observable<TradingMode> {
    this.setLocalMode(mode);

    if (!this.hasToken()) {
      return of(mode);
    }

    return this.http.post<TradingModeResponse>(`/strategy/mode?mode=${mode}`, null).pipe(
      map((res) => this.normalizeMode(res, mode)),
      tap((finalMode) => this.setLocalMode(finalMode)),
      catchError(() => of(this.getLocalMode()))
    );
  }

  // ------------------------
  // Helpers
  // ------------------------

  private hasToken(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  private getLocalMode(): TradingMode {
    const stored = sessionStorage.getItem(this.storageKey);
    if (stored === 'LIVE' || stored === 'PAPER') {
      return stored;
    }
    return 'PAPER';
  }

  private setLocalMode(mode: TradingMode): void {
    sessionStorage.setItem(this.storageKey, mode);
  }

  /**
   * Normalize mode coming from backend:
   * - Accept: { mode: "LIVE" | "PAPER" }
   * - Fallback to current local mode (or provided fallback)
   */
  private normalizeMode(res: any, fallback?: TradingMode): TradingMode {
    const m: any = res?.mode ?? res;
    if (m === 'LIVE' || m === 'PAPER') return m;
    return fallback ?? this.getLocalMode();
  }
}
