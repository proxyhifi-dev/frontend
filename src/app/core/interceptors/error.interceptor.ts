import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { mapHttpError } from '../utils/api-error';
import { AuthService } from '../services/auth.service';
import { DiagnosticsStoreService } from '../services/diagnostics-store.service';
import { ScanStoreService } from '../services/scan-store.service';

const parseRetryAfter = (headerValue: string | null): number | null => {
  if (!headerValue) {
    return null;
  }
  const numeric = Number(headerValue);
  if (!Number.isNaN(numeric)) {
    return Math.max(1, Math.floor(numeric));
  }
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    const diffSeconds = Math.ceil((dateMs - Date.now()) / 1000);
    return Math.max(1, diffSeconds);
  }
  return null;
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const diagnosticsStore = inject(DiagnosticsStoreService);
  const scanStore = inject(ScanStoreService);
  const isRetryableMethod = req.method === 'GET';
  const isAuthEndpoint = req.url.includes('/auth/');

  return next(req).pipe(
    retry({
      count: 1,
      delay: (error, retryCount) => {
        if (error instanceof HttpErrorResponse) {
          if (isRetryableMethod && !isAuthEndpoint && error.status === 0) {
            return timer(1000 * retryCount);
          }
        }
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const apiError = mapHttpError(error);
      if (error.status === 429) {
        const retryAfterHeader = error.headers?.get('Retry-After') ?? error.headers?.get('retry-after');
        const retryAfterSeconds = parseRetryAfter(retryAfterHeader) ?? 60;
        const message = `Rate limited. Try again in ${retryAfterSeconds}s`;
        toastService.showWarning(message);
        diagnosticsStore.setLastBackendError(`Rate limited. Retry after ${retryAfterSeconds}s.`);
        if (req.method === 'POST' && (req.url.includes('/strategy/scan-now') || req.url.includes('/scanner/run'))) {
          scanStore.setCooldown(retryAfterSeconds);
        }
      } else if (error.status === 401 || error.status === 403) {
        toastService.showError('Session expired / unauthorized');
      } else {
        toastService.showError(apiError.userMessage);
      }
      if ((error.status === 401 || error.status === 403) && !isAuthEndpoint) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
