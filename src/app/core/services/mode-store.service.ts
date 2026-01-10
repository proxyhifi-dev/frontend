import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, distinctUntilChanged, map, of, tap } from 'rxjs';
import { TradingMode, TradingModeService } from './trading-mode.service';

@Injectable({ providedIn: 'root' })
export class ModeStore {
  private readonly storageKey = 'tradingMode';
  private readonly modeSubject = new BehaviorSubject<TradingMode>(this.getInitialMode());

  readonly mode$ = this.modeSubject.asObservable().pipe(distinctUntilChanged());
  readonly isLive$ = this.mode$.pipe(map((mode) => mode === 'LIVE'));
  readonly modeLabel$ = this.mode$.pipe(map((mode) => (mode === 'LIVE' ? 'LIVE MODE' : 'PAPER MODE')));
  readonly toggleLabel$ = this.mode$.pipe(map((mode) => (mode === 'LIVE' ? 'Switch to Paper' : 'Switch to Live')));

  constructor(private tradingModeService: TradingModeService) {}

  get snapshot(): TradingMode {
    return this.modeSubject.value;
  }

  syncFromBackend(): Observable<TradingMode> {
    return this.tradingModeService.getMode().pipe(
      tap((mode) => this.updateMode(mode)),
      catchError(() => of(this.modeSubject.value))
    );
  }

  setMode(mode: TradingMode): Observable<TradingMode> {
    if (mode === this.modeSubject.value) {
      return of(mode);
    }
    return this.tradingModeService.setMode(mode).pipe(
      tap((nextMode) => this.updateMode(nextMode))
    );
  }

  private updateMode(mode: TradingMode): void {
    this.modeSubject.next(mode);
    localStorage.setItem(this.storageKey, mode);
  }

  private getInitialMode(): TradingMode {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === 'LIVE' || stored === 'PAPER') {
      return stored;
    }
    return 'PAPER';
  }
}
