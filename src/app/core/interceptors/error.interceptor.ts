import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, switchMap, throwError, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { mapHttpError } from '../utils/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const isRetryableMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error, retryCount) => {
        // Only retry on network errors or 5xx errors
        if (error instanceof HttpErrorResponse) {
          if (isRetryableMethod && (error.status >= 500 || error.status === 0)) {
            return timer(1000 * retryCount);
          }
        }
        throw error;
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const apiError = mapHttpError(error);

      if (error.status === 401 && authService.refreshToken && !req.url.includes('/auth/refresh')) {
        return authService.refreshAccessToken().pipe(
          switchMap((token) => {
            if (!token) {
              return throwError(() => error);
            }
            const refreshed = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            });
            return next(refreshed);
          }),
          catchError(() => {
            authService.logout();
            toastService.showError(apiError.userMessage);
            return throwError(() => error);
          })
        );
      }

      if (error.status === 401 || error.status === 403) {
        authService.logout();
      }

      toastService.showError(apiError.userMessage);
      return throwError(() => error);
    })
  );
};
