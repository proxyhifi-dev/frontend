import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { mapHttpError } from '../utils/api-error';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
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
      if (error.status === 401 && !isAuthEndpoint) {
        toastService.showError(apiError.userMessage);
        authService.logout();
      } else {
        toastService.showError(apiError.userMessage);
      }
      return throwError(() => error);
    })
  );
};
