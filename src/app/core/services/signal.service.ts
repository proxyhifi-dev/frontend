import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map, throwError } from 'rxjs';
import { Signal, SignalDetail } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class SignalService {
  private executionSupportedSubject = new BehaviorSubject<boolean>(false);
  readonly executionSupported$ = this.executionSupportedSubject.asObservable();

  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {
    this.runtimeConfig.config$.subscribe(() => {
      this.executionSupportedSubject.next(this.hasApproveEndpoint());
    });
  }

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>('/strategy/signals');
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
    if (!this.runtimeConfig.hasEndpoint('/strategy/scan-now')) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Scan endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.post<void>('/strategy/scan-now', {});
  }

  executeSignal(signalId: number): Observable<void> {
    if (!this.executionSupportedSubject.value) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Signal approval endpoint not available on this backend.'
      } as ApiError));
    }

    return this.http.post<void>(`/strategy/signals/${signalId}/approve`, {}).pipe(
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.executionSupportedSubject.next(false);
        }
        return throwError(() => error);
      })
    );
  }

  private hasApproveEndpoint(): boolean {
    if (this.runtimeConfig.hasEndpoint('/strategy/signals/{id}/approve')) {
      return true;
    }
    return this.runtimeConfig.endpoints.some((endpoint) =>
      endpoint.path.includes('/strategy/signals') && endpoint.path.includes('approve')
    );
  }
}
