export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface UserProfile {
  name: string;
  availableFunds: number;
  availableRealFunds: number;
  availablePaperFunds: number;
  totalInvested: number;
  currentValue: number;
  todaysPnl: number;
  holdings: Holding[];
}

export interface Trade {
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

export interface PaperPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

export interface PositionView {
  id?: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent?: number;
  exitPrice?: number;
  realizedPnl?: number;
  exitReason?: string;
  sector?: string;
  stopLoss?: number;
  grade?: string;
  exitTime?: string;
  isPaperTrade?: boolean;
  rMultiple?: number;
}

export interface Signal {
  id: number;
  symbol: string;
  signalScore: number;
  grade: string;
  entryPrice?: number;
  scanTime: string;
  hasEntrySignal: boolean;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfit: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy?: number;
  maxDrawdown: number;
  longestWinStreak?: number;
  longestLossStreak?: number;
  lastTradeTime?: string;
  lastTradeSymbol?: string;
}

export interface RiskStatus {
  equity: number;
  openPositions: number;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}
