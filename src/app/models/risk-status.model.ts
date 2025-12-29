export interface RiskStatus {
  dailyLoss: number;
  dailyLossLimitPct: number;
  consecutiveLosses: number;
  maxConsecutiveLosses: number;
  tradingHalted: boolean;
  goodTradingTime: boolean;
}
