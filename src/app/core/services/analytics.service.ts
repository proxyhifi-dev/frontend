import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PerformanceMetrics } from '../models/domain.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMetrics(range: string = '30d'): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`${this.baseUrl}/performance/metrics?range=${range}`);
  }
}
