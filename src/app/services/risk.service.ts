import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RiskStatus } from '../models/risk-status.model';

@Injectable({
  providedIn: 'root'
})
export class RiskService {
  private apiBase = 'http://localhost:8080/api/risk';

  constructor(private http: HttpClient) {}

  getRiskStatus(): Observable<RiskStatus> {
    return this.http.get<RiskStatus>(`${this.apiBase}/status`);
  }
}
