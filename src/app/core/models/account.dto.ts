export interface AccountOverviewDTO {
  currentValue?: number;
  availableFunds?: number;
  availablePaperFunds?: number;
  availableRealFunds?: number;
  marginUsed?: number;
  equityUsed?: number;
  todayPnL?: number;
  unrealizedPnl?: number;
  todaysPnl?: number;
  nextScanTime?: string;
  [key: string]: unknown;
}

export interface PaperAccountDTO {
  balance?: number;
  free?: number;
  used?: number;
  equity?: number;
  totalEquity?: number;
  [key: string]: unknown;
}
