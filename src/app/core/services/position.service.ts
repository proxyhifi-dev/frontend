import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { StoreService } from './store.service';
import { PositionView, PaperPosition, Trade } from '../models/domain.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PositionService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private store: StoreService) {}

  private get endpoints() {
    const isLive = this.store.snapshot.isLiveMode;
    // Dynamically choose endpoint based on mode
    return {
      open: isLive ? `${this.baseUrl}/trades/open` : `${this.baseUrl}/paper/positions/open`,
      closed: isLive ? `${this.baseUrl}/trades/closed` : `${this.baseUrl}/paper/positions/closed`
    };
  }

  getOpenPositions(): Observable<PositionView[]> {
    if (this.store.snapshot.isLiveMode) {
      return this.http.get<Trade[]>(this.endpoints.open).pipe(
        map(trades => trades.map(trade => this.toViewFromTrade(trade)))
      );
    }
    return this.http.get<PaperPosition[]>(this.endpoints.open).pipe(
      map(positions => positions.map(position => this.toViewFromPaper(position)))
    );
  }

  getClosedPositions(): Observable<PositionView[]> {
    if (this.store.snapshot.isLiveMode) {
      return this.http.get<Trade[]>(this.endpoints.closed).pipe(
        map(trades => trades.map(trade => this.toViewFromTrade(trade)))
      );
    }
    return this.http.get<PaperPosition[]>(this.endpoints.closed).pipe(
      map(positions => positions.map(position => this.toViewFromPaper(position)))
    );
  }

  closePosition(positionId: number | undefined): Observable<any> {
    if (!positionId) {
      return new Observable(observer => {
        observer.error(new Error('Position id missing'));
        observer.complete();
      });
    }
    const isLive = this.store.snapshot.isLiveMode;
    const url = isLive
      ? `${this.baseUrl}/trades/close`
      : `${this.baseUrl}/paper/positions/close`;
    return this.http.post(url, { id: positionId });
  }

  private toViewFromTrade(trade: Trade): PositionView {
    const currentPrice = trade.currentPrice ?? trade.entryPrice;
    const pnl = trade.pnl ?? (currentPrice - trade.entryPrice) * trade.quantity;
    const pnlPercent = trade.pnlPercent ?? (trade.entryPrice ? (pnl / (trade.entryPrice * trade.quantity)) * 100 : 0);
    return {
      id: trade.id,
      symbol: trade.symbol,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      currentPrice,
      pnl,
      pnlPercent,
      exitPrice: trade.exitPrice,
      realizedPnl: trade.realizedPnl,
      exitReason: trade.exitReason,
      stopLoss: trade.currentStopLoss ?? trade.stopLoss,
      grade: trade.grade,
      exitTime: trade.exitTime,
      isPaperTrade: trade.isPaperTrade ?? false,
      rMultiple: trade.rMultiple ?? 0
    };
  }

  private toViewFromPaper(position: PaperPosition): PositionView {
    return {
      symbol: position.symbol,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      currentPrice: position.ltp,
      pnl: position.pnl,
      pnlPercent: position.pnlPercent,
      exitPrice: position.ltp,
      realizedPnl: position.pnl,
      grade: 'N/A',
      isPaperTrade: true,
      rMultiple: 0
    };
  }
}
