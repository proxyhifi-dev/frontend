import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CorrelationMatrix, RiskStatus } from '../models/domain.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RiskService {
  private apiUrl = `${environment.apiUrl}/risk`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<RiskStatus> {
    return this.http.get<RiskStatus>(`${this.apiUrl}/status`);
  }

  getCorrelationMatrix(): Observable<CorrelationMatrix> {
    return this.http.get<CorrelationMatrix>(`${this.apiUrl}/correlation-matrix`);
  }

  getCircuitBreakerStatus(): Observable<CircuitBreakerStatus> {
    return this.http.get<CircuitBreakerStatus>(`${this.apiUrl}/circuit-breaker`);
  }

  triggerEmergencyStop(): Observable<any> {
    return this.http.post(`${this.apiUrl}/emergency-stop`, {});
  }
}

export interface CircuitBreakerStatus {
  triggered: boolean;
  reason?: string;
  dailyLossUsed?: number;
  dailyLossLimit?: number;
  lastTriggeredAt?: string;
}
