import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, throwError } from 'rxjs';
import { Signal, SignalDetail } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class SignalService {
  private executionSupportedSubject = new BehaviorSubject<boolean>(false);
  readonly executionSupported$ = this.executionSupportedSubject.asObservable();

  constructor(private http: HttpBaseService) {}

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>('/strategy/signals/recent');
  }

  getPendingSignals(): Observable<Signal[]> {
    return this.getSignals().pipe(
      map((signals) => signals.filter((signal) => signal.hasEntrySignal))
    );
  }

  getSignalDetail(signalId: number): Observable<SignalDetail> {
    return this.http.get<SignalDetail>(`/strategy/signals/${signalId}`).pipe(
      catchError((error: ApiError) => {
        if (error.status === 404) {
          return of({
            id: signalId,
            symbol: '—',
            signalScore: 0,
            grade: 'N/A'
          });
        }
        return throwError(() => error);
      })
    );
  }

  scanNow(): Observable<void> {
    return this.http.post<void>('/strategy/scan-now', {});
  }

  executeSignal(signalId: number): Observable<void> {
    if (!this.executionSupportedSubject.value) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Backend strategy execution endpoint pending.'
      } as ApiError));
    }

    return this.http.post<void>('/strategy/execute', { signalId }).pipe(
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.executionSupportedSubject.next(false);
        }
        return throwError(() => error);
      })
    );
  }
}
