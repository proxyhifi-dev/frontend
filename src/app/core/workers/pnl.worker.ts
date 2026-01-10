/// <reference lib="webworker" />

interface PnlWorkerPosition {
  symbol: string;
  entry: number;
  qty: number;
}

interface PnlWorkerPayload {
  positions: PnlWorkerPosition[];
  ltp: Record<string, number>;
}

addEventListener('message', ({ data }) => {
  // Perform heavy P&L math across 100s of positions here
  const payload = data as PnlWorkerPayload;
  const result = payload.positions.map((p) => ({
    ...p,
    pnl: ((payload.ltp[p.symbol] ?? p.entry) - p.entry) * p.qty
  }));
  postMessage(result);
});
