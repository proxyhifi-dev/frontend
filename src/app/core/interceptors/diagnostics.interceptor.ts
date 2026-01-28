import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { DiagnosticsStoreService } from '../services/diagnostics-store.service';
import { mapHttpError } from '../utils/api-error';

const headerKeys = ['x-request-id', 'x-correlation-id', 'x-correlationid', 'x-requestid', 'request-id'];
const bodyKeys = ['requestId', 'correlationId', 'traceId'];

const readHeader = (response: HttpResponse<unknown> | HttpErrorResponse, key: string): string | undefined => {
  const value = response.headers?.get(key);
  return value ?? undefined;
};

const pickHeader = (response: HttpResponse<unknown> | HttpErrorResponse): string | undefined => {
  for (const key of headerKeys) {
    const value = readHeader(response, key);
    if (value) {
      return value;
    }
  }
  return undefined;
};

const pickBodyId = (body: unknown): string | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  for (const key of bodyKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
};

export const diagnosticsInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  const store = inject(DiagnosticsStoreService);
  const startedAt = performance.now();
  const timestamp = new Date().toISOString();

  return next(req).pipe(
    tap({
      next: (event: HttpEvent<unknown>) => {
        if (!(event instanceof HttpResponse)) {
          return;
        }
        const latencyMs = Math.round(performance.now() - startedAt);
        const requestId = pickHeader(event) ?? pickBodyId(event.body);
        const correlationId = readHeader(event, 'x-correlation-id') ?? pickBodyId(event.body);
        store.logHttpCall({
          id: Date.now(),
          method: req.method,
          url: req.urlWithParams,
          status: event.status,
          latencyMs,
          timestamp,
          requestId,
          correlationId
        });
      },
      error: (error: HttpErrorResponse) => {
        const latencyMs = Math.round(performance.now() - startedAt);
        const requestId = pickHeader(error) ?? pickBodyId(error.error);
        const correlationId = readHeader(error, 'x-correlation-id') ?? pickBodyId(error.error);
        const apiError = mapHttpError(error);
        store.logHttpCall({
          id: Date.now(),
          method: req.method,
          url: req.urlWithParams,
          status: error.status,
          latencyMs,
          timestamp,
          requestId,
          correlationId,
          errorMessage: apiError.userMessage
        });
        store.setLastBackendError(`${apiError.userMessage} (${error.status || 'network error'})`);
        if (error.status === 0) {
          store.setNetworkError({
            message: apiError.userMessage,
            url: req.urlWithParams,
            timestamp
          });
        }
      }
    })
  );
};
