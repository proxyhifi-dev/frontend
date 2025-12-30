export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  productType: string;
  status: 'OPEN' | 'CLOSED';
  entryTime: string;
  exitTime?: string;
  exitReason?: string;
  sector?: string;
  realizedPnl?: number;
  exitPrice?: number;
}

export interface Signal {
  id: number;
  symbol: string;
  score: number;
  grade: 'A+++' | 'A++' | 'A' | 'B';
  adx: number;
  rsi: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  generatedTime: string;
  rejectionReason?: string;
  atr?: number;
  entryPrice?: number;
  sector?: string;
  correlation?: number;
  adx_score?: number;
}

// ✅ Ensuring these are exported to fix TS2305 errors
export interface RiskStatus {
  dailyLoss: number;
  dailyLimit: number;
  weeklyLoss: number;
  weeklyLimit: number;
  monthlyPnl: number;
  consecutiveLosses: number;
  cbActive: boolean;
}

export interface DashboardStats {
  todayPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  totalPnL: number;
  unrealizedPnL: number;
  winRate: number;
  profitFactor: number;
  activePositionsCount: number;
  riskLimit: number;
  roi: number;
}
