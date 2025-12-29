import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent?: number;
}

export interface UserProfile {
  name: string;
  availableFunds: number;      // Legacy field
  availableRealFunds: number;  // ✅ NEW: Real Broker Funds
  availablePaperFunds: number; // ✅ NEW: Paper Trading Funds
  totalInvested: number;
  currentValue: number;
  todaysPnl: number;
  holdings: Holding[];
}

export interface Signal {
  id: number;
  symbol: string;
  signalScore: number;
  entryPrice: number;
  scanTime: string;
  grade: string;
  stopLoss: number;
  hasEntrySignal?: boolean;
}

export interface Trade {
  id: number;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  exitTime: string;
  result: 'WIN' | 'LOSS' | 'OPEN';
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalProfit: number;
  totalLoss: number;
  bestTrade: number;
  worstTrade: number;
}

export interface PaperPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

export interface PaperStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private apiBase = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiBase}/account/profile`);
  }

  getPendingSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>(`${this.apiBase}/strategies/signals/pending`);
  }

  approveSignal(signalId: number, isPaper: boolean): Observable<any> {
    return this.http.post(`${this.apiBase}/strategies/signals/${signalId}/approve?isPaper=${isPaper}`, {});
  }

  rejectSignal(signalId: number): Observable<any> {
    return this.http.post(`${this.apiBase}/strategies/signals/${signalId}/reject`, {});
  }

  getRecentTrades(limit: number): Observable<Trade[]> {
    return this.http.get<Trade[]>(`${this.apiBase}/performance/recent?limit=${limit}`);
  }

  getTradeStats(): Observable<TradeStats> {
    return this.http.get<TradeStats>(`${this.apiBase}/performance/stats`);
  }

  getPaperPositions(): Observable<PaperPosition[]> {
    return this.http.get<PaperPosition[]>(`${this.apiBase}/paper/positions`);
  }

  getPaperStats(): Observable<PaperStats> {
    return this.http.get<PaperStats>(`${this.apiBase}/paper/stats`);
  }

  placeOrder(symbol: string, qty: number, type: string, isPaper: boolean): Observable<any> {
    return this.http.post(`${this.apiBase}/trade/execute`, { symbol, qty, type, isPaper });
  }
}
