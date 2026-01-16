import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, throwError } from 'rxjs';
import { BrokerConnectionStatus, BrokerErrorLog } from '../models/broker.dto';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class FyersOAuthService {
  private disconnectSupportedSubject = new BehaviorSubject<boolean>(false);
  private errorLogsSupportedSubject = new BehaviorSubject<boolean>(false);

  readonly disconnectSupported$ = this.disconnectSupportedSubject.asObservable();
  readonly errorLogsSupported$ = this.errorLogsSupportedSubject.asObservable();

  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {
    this.runtimeConfig.config$.subscribe(() => {
      this.disconnectSupportedSubject.next(this.runtimeConfig.hasEndpoint('/auth/fyers/disconnect'));
      this.errorLogsSupportedSubject.next(this.runtimeConfig.hasEndpoint('/auth/fyers/errors'));
    });
  }

  getAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>('/auth/fyers/auth-url');
  }

  handleCallback(authCode: string): Observable<BrokerConnectionStatus> {
    return this.http.post<BrokerConnectionStatus>('/auth/fyers/callback', { auth_code: authCode });
  }

  disconnectFyers(): Observable<void> {
    if (!this.disconnectSupportedSubject.value) {
      return of(undefined);
    }
    return this.http.post<void>('/auth/fyers/disconnect', {}).pipe(
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.disconnectSupportedSubject.next(false);
          return of(undefined);
        }
        return throwError(() => error);
      })
    );
  }

  getFyersStatus(): Observable<BrokerConnectionStatus> {
    return this.http.get<BrokerConnectionStatus>('/auth/fyers/status');
  }

  getFyersErrors(): Observable<BrokerErrorLog[]> {
    if (!this.errorLogsSupportedSubject.value) {
      return of([]);
    }
    return this.http.get<BrokerErrorLog[]>('/auth/fyers/errors').pipe(
      tap(() => this.errorLogsSupportedSubject.next(true)),
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.errorLogsSupportedSubject.next(false);
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }
}
