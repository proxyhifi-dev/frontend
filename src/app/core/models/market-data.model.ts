export interface EquityCurvePoint {
  timestamp: string;
  value: number;
}

// The dashboard currently visualizes the equity curve.
// Keep this strongly typed so it can be passed around without
// running into index-signature-only typing issues.
export type MarketDataPoint = EquityCurvePoint;
