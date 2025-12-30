import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RiskStatus } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class RiskService {
  private apiUrl = '/api/risk';

  constructor(private http: HttpClient) {}

  getCircuitBreakerStatus(): Observable<RiskStatus> {
    return this.http.get<RiskStatus>(`${this.apiUrl}/status`);
  }

  triggerEmergencyStop(): Observable<any> {
    return this.http.post(`${this.apiUrl}/emergency-stop`, {});
  }
}
