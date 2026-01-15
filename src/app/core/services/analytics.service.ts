import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PerformanceMetrics } from '../models/domain.model';
import { HttpBaseService } from '../http/http-base.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpBaseService) {}

  getMetrics(range: string = '30d'): Observable<PerformanceMetrics> {
    return this.http.get<PerformanceMetrics>(`/performance/metrics?range=${range}`);
  }
}
