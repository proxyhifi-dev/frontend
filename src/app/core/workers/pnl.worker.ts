/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  // Perform heavy P&L math across 100s of positions here
  const result = data.positions.map((p: any) => ({
    ...p,
    pnl: (data.ltp[p.symbol] - p.entry) * p.qty
  }));
  postMessage(result);
});
