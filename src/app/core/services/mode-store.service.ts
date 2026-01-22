import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, map, of, tap } from 'rxjs';
import { TradingMode, TradingModeService } from './trading-mode.service';
import { TokenService } from '../auth/token.service';

@Injectable({ providedIn: 'root' })
export class ModeStore {
  private readonly storageKey = 'tradingMode';
  private readonly modeSubject = new BehaviorSubject<TradingMode>(this.getInitialMode());
  private readonly modeSupportedSubject = new BehaviorSubject<boolean>(true);

  readonly mode$ = this.modeSubject.asObservable().pipe(distinctUntilChanged());
  readonly isLive$ = this.mode$.pipe(map((mode) => mode === 'LIVE'));
  readonly modeLabel$ = this.mode$.pipe(map((mode) => (mode === 'LIVE' ? 'LIVE MODE' : 'PAPER MODE')));
  readonly toggleLabel$ = this.mode$.pipe(map((mode) => (mode === 'LIVE' ? 'Switch to Paper' : 'Switch to Live')));
  readonly modeSupported$ = this.modeSupportedSubject.asObservable();

  constructor(
    private tradingModeService: TradingModeService,
    private tokenService: TokenService
  ) {
    this.tradingModeService.modeSupported$.subscribe((supported) => {
      this.modeSupportedSubject.next(supported);
    });
  }

  get snapshot(): TradingMode {
    return this.modeSubject.value;
  }

  get modeSupported(): boolean {
    return this.modeSupportedSubject.value;
  }

  /**
   * ✅ Only sync from backend when user is authenticated.
   * Otherwise this will trigger 401/403 on app load (expected but noisy).
   */
  syncFromBackend(): Observable<TradingMode> {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      // keep local mode without hitting backend
      return of(this.modeSubject.value);
    }

    return this.tradingModeService.getMode().pipe(
      tap((mode) => this.updateMode(mode)),
      catchError(() => of(this.modeSubject.value))
    );
  }

  setMode(mode: TradingMode): Observable<TradingMode> {
    if (mode === this.modeSubject.value) {
      return of(mode);
    }

    // ✅ If not logged in, update locally only (or you can choose to block)
    const token = this.tokenService.getAccessToken();
    if (!token) {
      this.updateMode(mode);
      return of(mode);
    }

    return this.tradingModeService.setMode(mode).pipe(
      tap((nextMode) => this.updateMode(nextMode)),
      catchError(() => of(this.modeSubject.value))
    );
  }

  private updateMode(mode: TradingMode): void {
    this.modeSubject.next(mode);
    sessionStorage.setItem(this.storageKey, mode);
  }

  private getInitialMode(): TradingMode {
    const stored = sessionStorage.getItem(this.storageKey);
    if (stored === 'LIVE' || stored === 'PAPER') {
      return stored;
    }
    return 'PAPER';
  }
}
