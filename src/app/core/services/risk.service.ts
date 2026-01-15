import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CorrelationMatrix, RiskStatus } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';

@Injectable({ providedIn: 'root' })
export class RiskService {
  constructor(private http: HttpBaseService) {}

  getStatus(): Observable<RiskStatus> {
    return this.http.get<RiskStatus>('/risk/status');
  }

  getCorrelationMatrix(): Observable<CorrelationMatrix> {
    return this.http.get<CorrelationMatrix>('/risk/correlation-matrix');
  }

  getCircuitBreakerStatus(): Observable<CircuitBreakerStatus> {
    return this.http.get<CircuitBreakerStatus>('/guard/status');
  }

  clearGuard(): Observable<void> {
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
