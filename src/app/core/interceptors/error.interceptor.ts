import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error) => {
      let errorMessage = error.error?.message || 'An unknown error occurred';

      // ✅ Call the new method
      notificationService.error('API Error', errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
