import { Injectable } from '@angular/core';
import { Observable, map, throwError, BehaviorSubject } from 'rxjs';
import { ModeStore } from './mode-store.service';
import { PositionView, PaperPosition } from '../models/domain.model';
import { TradeDTO } from '../models/trade.dto';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ApiError } from '../models/api-error.model';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ApiConfigService } from '../config/api-config.service';

@Injectable({ providedIn: 'root' })
export class PositionService {
  private closeSupportedSubject = new BehaviorSubject<boolean>(false);
  readonly closeSupported$ = this.closeSupportedSubject.asObservable();
  private exportSupportedSubject = new BehaviorSubject<boolean>(false);
  private exportEndpointSubject = new BehaviorSubject<string | null>(null);
  readonly exportSupported$ = this.exportSupportedSubject.asObservable();

  constructor(
    private modeStore: ModeStore,
    private portfolio: PortfolioService,
    private http: HttpBaseService,
    private runtimeConfig: RuntimeConfigService,
    private apiConfig: ApiConfigService
  ) {
    this.runtimeConfig.config$.subscribe(() => {
      this.closeSupportedSubject.next(
        this.runtimeConfig.hasEndpoint('/positions/{symbol}/close') ||
          this.runtimeConfig.hasEndpoint('/positions/close')
      );
      const exportEndpoint = this.findExportEndpoint();
      this.exportEndpointSubject.next(exportEndpoint);
      this.exportSupportedSubject.next(Boolean(exportEndpoint));
    });
  }

  getOpenPositions(): Observable<PositionView[]> {
    if (this.modeStore.snapshot === 'LIVE') {
      return this.portfolio.getLiveOpenPositions().pipe(
        map((trades) => trades.map((trade) => this.toViewFromTrade(trade)))
      );
    }
    return this.portfolio.getPaperOpenPositions().pipe(
      map((positions) => positions.map((position) => this.toViewFromPaper(position)))
    );
  }

  getClosedPositions(): Observable<PositionView[]> {
    if (this.modeStore.snapshot === 'LIVE') {
      return this.portfolio.getLiveClosedPositions().pipe(
        map((trades) => trades.map((trade) => this.toViewFromTrade(trade)))
      );
    }
    return this.portfolio.getPaperClosedPositions().pipe(
      map((positions) => positions.map((position) => this.toViewFromPaper(position)))
    );
  }

  closePosition(position: { id?: number; symbol?: string } | undefined): Observable<void> {
    if (!position?.symbol) {
      return throwError(() => new Error('Position symbol missing'));
    }
    if (!this.closeSupportedSubject.value) {
      return throwError(() => ({
        status: 404,
        userMessage: 'Position close is not supported by the current backend.'
      } as ApiError));
    }
    return this.http.post<void>(`/positions/${encodeURIComponent(position.symbol)}/close`, {});
  }

  getExportUrl(): string | null {
    const endpoint = this.exportEndpointSubject.value;
    if (!endpoint) {
      return null;
    }
    return this.apiConfig.buildApiUrl(endpoint);
  }

  private toViewFromTrade(trade: TradeDTO): PositionView {
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
      rMultiple: trade.rMultiple ?? 0,
      entryTime: trade.entryTime
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

  private findExportEndpoint(): string | null {
    const endpoints = this.runtimeConfig.endpoints;
    if (this.runtimeConfig.hasEndpoint('/positions/export')) {
      return '/positions/export';
    }
    if (this.runtimeConfig.hasEndpoint('/positions/report')) {
      return '/positions/report';
    }
    if (this.runtimeConfig.hasEndpoint('/positions/export/csv')) {
      return '/positions/export/csv';
    }
    const candidate = endpoints.find((endpoint) =>
      endpoint.path.includes('/positions') &&
      (endpoint.path.includes('export') || endpoint.path.includes('report') || endpoint.path.includes('csv'))
    );
    return candidate?.path ?? null;
  }
}
