import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
  HttpContext
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiConfigService } from '../config/api-config.service';
import { ApiError } from '../models/api-error.model';
import { mapHttpError } from '../utils/api-error';

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  context?: HttpContext;
  observe?: 'body';
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
}

@Injectable({ providedIn: 'root' })
export class HttpBaseService {
  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  get<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.get<T>(this.resolveUrl(url), options).pipe(catchError((err) => this.handleError(err)));
  }

  post<T>(url: string, body: unknown, options?: HttpOptions): Observable<T> {
    return this.http.post<T>(this.resolveUrl(url), body, options).pipe(catchError((err) => this.handleError(err)));
  }

  put<T>(url: string, body: unknown, options?: HttpOptions): Observable<T> {
    return this.http.put<T>(this.resolveUrl(url), body, options).pipe(catchError((err) => this.handleError(err)));
  }

  delete<T>(url: string, options?: HttpOptions): Observable<T> {
    return this.http.delete<T>(this.resolveUrl(url), options).pipe(catchError((err) => this.handleError(err)));
  }

  private resolveUrl(url: string): string {
    return this.apiConfig.buildApiUrl(url);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = mapHttpError(error);
    return throwError(() => apiError);
  }
}
