import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface HttpCallLogEntry {
  id: number;
  method: string;
  url: string;
  status: number;
  latencyMs: number;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
  errorMessage?: string;
}

export interface NetworkErrorState {
  message: string;
  url: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class DiagnosticsStoreService {
  private readonly maxEntries = 200;
  private readonly httpCallsSubject = new BehaviorSubject<HttpCallLogEntry[]>([]);
  private readonly lastBackendErrorSubject = new BehaviorSubject<string>('');
  private readonly networkErrorSubject = new BehaviorSubject<NetworkErrorState | null>(null);

  readonly httpCalls$ = this.httpCallsSubject.asObservable();
  readonly lastBackendError$ = this.lastBackendErrorSubject.asObservable();
  readonly networkError$ = this.networkErrorSubject.asObservable();

  logHttpCall(entry: HttpCallLogEntry): void {
    const existing = this.httpCallsSubject.value;
    const next = [entry, ...existing].slice(0, this.maxEntries);
    this.httpCallsSubject.next(next);
  }

  setLastBackendError(message: string): void {
    if (!message) {
      return;
    }
    this.lastBackendErrorSubject.next(message);
  }

  setNetworkError(state: NetworkErrorState): void {
    this.networkErrorSubject.next(state);
  }

  clearNetworkError(): void {
    this.networkErrorSubject.next(null);
  }
}
