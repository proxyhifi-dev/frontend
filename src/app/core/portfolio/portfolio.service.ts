import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { TradeDTO } from '../models/trade.dto';
import { PaperPosition } from '../models/domain.model';
import { OrderRow } from '../services/orders.service';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  constructor(private http: HttpBaseService) {}

  getLiveOrders(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>('/portfolio/orders');
  }

  getPaperOrders(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>('/paper/portfolio/orders');
  }

  getLiveTrades(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/portfolio/trades');
  }

  getPaperTrades(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/paper/portfolio/trades');
  }

  getLiveOpenPositions(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/portfolio/positions/open');
  }

  getLiveClosedPositions(): Observable<TradeDTO[]> {
    return this.http.get<TradeDTO[]>('/portfolio/positions/closed');
  }

  getPaperOpenPositions(): Observable<PaperPosition[]> {
    return this.http.get<PaperPosition[]>('/paper/portfolio/positions/open');
  }

  getPaperClosedPositions(): Observable<PaperPosition[]> {
    return this.http.get<PaperPosition[]>('/paper/portfolio/positions/closed');
  }
}
