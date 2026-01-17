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

  clearGuard(): Observable<void> {
    if (!this.runtimeConfig.hasEndpoint('/guard/clear')) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Guard reset endpoint not available on this backend.'
      } as ApiError));
    }
    return this.http.post<void>('/guard/clear', {});
  }

  triggerEmergencyStop(): Observable<void> {
    return this.http.post<void>('/risk/emergency-stop', {});
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
