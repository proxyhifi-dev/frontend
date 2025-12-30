import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreService } from './store.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private baseUrl = '/api';

  constructor(private http: HttpClient, private store: StoreService) {}

  getOverview(period: string = '30d'): Observable<any> {
    const isLive = this.store.snapshot.isLiveMode;
    const endpoint = isLive ? `${this.baseUrl}/performance/live` : `${this.baseUrl}/performance/paper`;
    return this.http.get<any>(`${endpoint}?period=${period}`);
  }
}
