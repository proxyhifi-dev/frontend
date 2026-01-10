export interface TradeDTO {
  id: number;
  symbol: string;
  tradeType: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime: string;
  exitTime?: string;
  stopLoss?: number;
  currentStopLoss?: number;
  atr?: number;
  highestPrice?: number;
  isPaperTrade?: boolean;
  status?: string;
  exitReason?: string;
  grade?: string;
  rMultiple?: number;
  breakevenMoved?: boolean;
  realizedPnl?: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
}
