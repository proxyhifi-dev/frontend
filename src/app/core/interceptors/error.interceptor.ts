import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private notificationService: NotificationService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'An unknown error occurred';
        if (error.error instanceof ErrorEvent) {
          message = error.error.message;
        } else {
          message = error.error?.message || `Error Code: ${error.status}`;
        }

        // ✅ Fix: Pass 'API Error' as the title argument
        this.notificationService.error('API Error', message);
        return throwError(() => error);
      })
    );
  }
}
