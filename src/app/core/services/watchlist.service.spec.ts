import { WatchlistService } from './watchlist.service';

describe('WatchlistService', () => {
  let service: WatchlistService;

  beforeEach(() => {
    service = new WatchlistService({} as any, {} as any);
  });

  it('normalizes and deduplicates symbols', () => {
    const result = service.validateSymbols('aapl, AAPL, msft');
    expect(result.symbols).toEqual(['AAPL', 'MSFT']);
    expect(result.errors.length).toBe(0);
  });

  it('enforces max symbols', () => {
    const symbols = Array.from({ length: 101 }, (_, i) => `SYM${i}`);
    const result = service.validateSymbols(symbols);
    expect(result.errors.some((err) => err.includes('Watchlist supports'))).toBeTrue();
  });
});
