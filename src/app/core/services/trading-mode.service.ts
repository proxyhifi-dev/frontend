import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';
import { TokenService } from '../auth/token.service';

export type TradingMode = 'LIVE' | 'PAPER';

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
   */
  getMode(): Observable<TradingMode> {
    if (!this.hasToken()) {
      return of(this.getLocalMode());
    }

    return this.http.get<TradingMode>('/strategy/mode').pipe(
      catchError((err: ApiError) => {
        this.modeSupportedSubject.next(false);
        return of(this.getLocalMode());
      })
    );
  }

  /**
   * ✅ Safe mode switch
   */
  setMode(mode: TradingMode): Observable<TradingMode> {
    this.setLocalMode(mode);

    if (!this.hasToken()) {
      return of(mode);
    }

    return this.http.post<TradingMode>('/strategy/mode', { mode }).pipe(
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
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'LIVE' || stored === 'PAPER') {
      return stored;
    }
    return 'PAPER';
  }

  private setLocalMode(mode: TradingMode): void {
    localStorage.setItem(this.storageKey, mode);
  }
}
