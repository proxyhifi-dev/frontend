import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { TradeDTO } from '../models/trade.dto';
import { PaperPosition } from '../models/domain.model';
import { OrderRow } from '../services/orders.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getLiveOrders(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>('/orders');
  }

  getPaperOrders(): Observable<OrderRow[]> {
    return this.optionalGet<OrderRow[]>('/paper/orders', []);
  }

  getLiveTrades(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/trades');
  }

  getPaperTrades(): Observable<TradeDTO[]> {
    return this.optionalGet<TradeDTO[]>('/paper/trades', []);
  }

  getLiveOpenPositions(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/positions/open');
  }

  getLiveClosedPositions(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/positions/closed');
  }

  getPaperOpenPositions(): Observable<PaperPosition[]> {
    return this.optionalGet<PaperPosition[]>('/paper/positions/open', []);
  }

  getPaperClosedPositions(): Observable<PaperPosition[]> {
    return this.optionalGet<PaperPosition[]>('/paper/positions/closed', []);
  }

  private optionalGet<T>(path: string, fallback: T): Observable<T> {
    if (!this.runtimeConfig.hasEndpoint(path)) {
      return of(fallback);
    }
    return this.http.get<T>(path);
  }
}
