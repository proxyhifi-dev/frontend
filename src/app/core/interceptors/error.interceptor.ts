import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { mapHttpError } from '../utils/api-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const isRetryableMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error, retryCount) => {
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
      toastService.showError(apiError.userMessage);
      return throwError(() => error);
    })
  );
};
