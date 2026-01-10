export interface HoldingDTO {
  symbol?: string;
  tradingSymbol?: string;
  ticker?: string;
  instrument?: string;
  qty?: number;
  quantity?: number;
  netQty?: number;
  avgPrice?: number;
  averagePrice?: number;
  buyAvg?: number;
  ltp?: number;
  lastPrice?: number;
  currentPrice?: number;
  pnl?: number;
  profitLoss?: number;
  unrealizedPnl?: number;
  pnlPercent?: number;
  profitLossPercent?: number;
  unrealizedPnlPercent?: number;
  value?: number;
  marketValue?: number;
  currentValue?: number;
}
