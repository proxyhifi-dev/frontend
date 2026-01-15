import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, throwError } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';

export type TradingMode = 'LIVE' | 'PAPER';

@Injectable({ providedIn: 'root' })
export class TradingModeService {
  private readonly storageKey = 'tradingMode';
  private modeSupportedSubject = new BehaviorSubject<boolean>(true);
  readonly modeSupported$ = this.modeSupportedSubject.asObservable();

  constructor(private http: HttpBaseService) {}

  getMode(): Observable<TradingMode> {
    return this.http.get<{ mode: TradingMode }>('/strategy/mode').pipe(
      map((response) => response.mode),
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.modeSupportedSubject.next(false);
          return of(this.getLocalMode());
        }
        return throwError(() => error);
      })
    );
  }

  setMode(mode: TradingMode): Observable<TradingMode> {
    if (!this.modeSupportedSubject.value) {
      this.setLocalMode(mode);
      return of(mode);
    }
    return this.http.post<void>(`/strategy/mode?mode=${mode}`, {}).pipe(
      map(() => mode),
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.modeSupportedSubject.next(false);
          this.setLocalMode(mode);
          return of(mode);
        }
        return throwError(() => error);
      })
    );
  }

  get modeSupported(): boolean {
    return this.modeSupportedSubject.value;
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
