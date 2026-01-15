import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpBackend,
  HttpClient
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, BehaviorSubject, filter, switchMap, take, catchError, throwError, finalize } from 'rxjs';
import { ApiConfigService } from '../config/api-config.service';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../models/auth.model';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const apiConfig = inject(ApiConfigService);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const httpBackend = inject(HttpBackend);
  const http = new HttpClient(httpBackend);

  const isApiRequest = apiConfig.isApiRequest(req.url) || req.url.startsWith('/api');
  const accessToken = tokenService.getAccessToken();

  let authReq = req;
  if (accessToken && isApiRequest && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isUnauthorized = error.status === 401;
      const isRefreshCall = req.url.includes('/auth/refresh');
      const alreadyRetried = req.headers.has('X-Refresh-Attempt');

      if (!isUnauthorized || isRefreshCall || alreadyRetried || !isApiRequest) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        authService.logout();
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter((token) => !!token),
          take(1),
          switchMap((token) => next(addAuthHeader(req, token as string, true)))
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return http.post<AuthResponse>(apiConfig.buildApiUrl('/auth/refresh'), { refreshToken }).pipe(
        switchMap((response) => {
          const newToken = response.accessToken || response.token || '';
          if (!newToken) {
            authService.logout();
            return throwError(() => error);
          }
          tokenService.setAccessToken(newToken);
          refreshSubject.next(newToken);
          return next(addAuthHeader(req, newToken, true));
        }),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
        finalize(() => {
          isRefreshing = false;
        })
      );
    })
  );
};

const addAuthHeader = (req: HttpRequest<unknown>, token: string, markRetry = false) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(markRetry ? { 'X-Refresh-Attempt': 'true' } : {})
  };
  return req.clone({ setHeaders: headers });
};
