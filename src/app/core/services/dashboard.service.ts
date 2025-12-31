import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/account/summary?type=PAPER`);
  }

  getEquityCurve(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/performance/equity-curve?type=PAPER`);
  }

  getSignals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/strategy/signals`);
  }
}
