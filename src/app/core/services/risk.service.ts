import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { CorrelationMatrix, RiskStatus } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ToastService } from './toast.service';
import { ApiError } from '../models/api-error.model';

@Injectable({ providedIn: 'root' })
export class RiskService {
  private warnedCorrelation = false;

  constructor(
    private http: HttpBaseService,
    private runtimeConfig: RuntimeConfigService,
    private toastService: ToastService
  ) {}

  getStatus(): Observable<RiskStatus> {
    return this.http.get<RiskStatus>('/risk/status');
  }

  getCorrelationMatrix(): Observable<CorrelationMatrix> {
    if (!this.runtimeConfig.hasEndpoint('/risk/correlation-matrix')) {
      if (!this.warnedCorrelation) {
        this.warnedCorrelation = true;
        this.toastService.showWarning('Correlation data not available on this backend.');
      }
      return of({ symbols: [], matrix: [] });
    }
    return this.http.get<CorrelationMatrix>('/risk/correlation-matrix');
  }

  getCircuitBreakerStatus(): Observable<CircuitBreakerStatus> {
    if (this.runtimeConfig.hasEndpoint('/guard/status')) {
      return this.http.get<CircuitBreakerStatus>('/guard/status');
    }
    if (this.runtimeConfig.hasEndpoint('/guard/state')) {
      return this.http.get<CircuitBreakerStatus>('/guard/state');
    }
    return of({ triggered: false });
  }

  getEmergencyStatus(): Observable<EmergencyStatus | null> {
    const endpoint = this.resolveEndpoint([
      { method: 'GET', path: '/risk/emergency-status' },
      { method: 'GET', path: '/risk/kill-switch/status' },
      { method: 'GET', path: '/guard/kill-switch/status' }
    ]);
    if (!endpoint) {
      return of(null);
    }
    return this.http.get<EmergencyStatus>(endpoint);
  }

  getReconciliationStatus(): Observable<ReconciliationStatus | null> {
    const endpoint = this.resolveEndpoint([
      { method: 'GET', path: '/reconciliation/status' },
      { method: 'GET', path: '/risk/reconciliation/status' },
      { method: 'GET', path: '/risk/reconciliation' }
    ]);
    if (!endpoint) {
      return of(null);
    }
    return this.http.get<ReconciliationStatus>(endpoint);
  }

  clearGuard(): Observable<void> {
    if (!this.runtimeConfig.hasEndpoint('/guard/clear')) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Guard reset endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.post<void>('/guard/clear', {});
  }

  isEmergencyStopSupported(): boolean {
    return !!this.resolveEndpoint([
      { method: 'POST', path: '/risk/emergency-stop' },
      { method: 'POST', path: '/risk/kill-switch' },
      { method: 'POST', path: '/guard/kill-switch' }
    ]);
  }

  triggerEmergencyStop(): Observable<void> {
    const endpoint = this.resolveEndpoint([
      { method: 'POST', path: '/risk/emergency-stop' },
      { method: 'POST', path: '/risk/kill-switch' },
      { method: 'POST', path: '/guard/kill-switch' }
    ]);
    if (!endpoint) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Emergency kill switch endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.post<void>(endpoint, {});
  }

  private resolveEndpoint(entries: Array<{ method: string; path: string }>): string | null {
    const match = entries.find((entry) => this.runtimeConfig.hasEndpoint(entry.method, entry.path));
    return match?.path ?? null;
  }
}

export interface CircuitBreakerStatus {
  triggered: boolean;
  reason?: string;
  dailyLossUsed?: number;
  dailyLossLimit?: number;
  portfolioHeat?: number;
  lastTriggeredAt?: string;
}

export interface EmergencyStatus {
  cancellingOrders?: boolean;
  flatteningPositions?: boolean;
  tokensRevoked?: boolean;
  message?: string;
  updatedAt?: string;
}

export interface ReconciliationStatus {
  mismatch: boolean;
  reason?: string;
  affectedSymbols?: string[];
  updatedAt?: string;
}
