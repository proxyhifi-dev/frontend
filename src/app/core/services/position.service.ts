import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StoreService } from './store.service';
import { Position } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class PositionService {
  private baseUrl = '/api';

  constructor(private http: HttpClient, private store: StoreService) {}

  private get endpoints() {
    const isLive = this.store.snapshot.isLiveMode;
    // Dynamically choose endpoint based on mode
    return {
      open: isLive ? `${this.baseUrl}/trade/positions/open` : `${this.baseUrl}/paper/positions/open`,
      closed: isLive ? `${this.baseUrl}/trade/positions/closed` : `${this.baseUrl}/paper/positions/closed`,
      closePos: isLive ? `${this.baseUrl}/trade/close` : `${this.baseUrl}/paper/close`
    };
  }

  getOpenPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(this.endpoints.open);
  }

  getClosedPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(this.endpoints.closed);
  }

  closePosition(id: number): Observable<any> {
    return this.http.post(this.endpoints.closePos, { tradeId: id });
  }
}
