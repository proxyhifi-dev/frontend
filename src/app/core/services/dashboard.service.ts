import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreService } from './store.service';
import { DashboardStats } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl = '/api';

  constructor(private http: HttpClient, private store: StoreService) {}

  getSummary(): Observable<DashboardStats> {
    const isLive = this.store.snapshot.isLiveMode;
    const type = isLive ? 'LIVE' : 'PAPER';
    return this.http.get<DashboardStats>(`${this.baseUrl}/account/summary?type=${type}`);
  }

  getEquityCurve(): Observable<any[]> {
    const isLive = this.store.snapshot.isLiveMode;
    const type = isLive ? 'LIVE' : 'PAPER';
    return this.http.get<any[]>(`${this.baseUrl}/performance/equity-curve?type=${type}`);
  }
}
