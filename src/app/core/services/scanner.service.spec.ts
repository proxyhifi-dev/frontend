import { ScannerService } from './scanner.service';

describe('ScannerService', () => {
  let service: ScannerService;

  beforeEach(() => {
    service = new ScannerService({} as any, {} as any);
  });

  it('builds a symbols run request', () => {
    const request = service.buildRunRequest('SYMBOLS', ['AAPL', 'MSFT'], 'Momentum');
    expect(request.universe.type).toBe('SYMBOLS');
    expect(request.universe.symbols).toEqual(['AAPL', 'MSFT']);
    expect(request.strategy).toBe('Momentum');
  });
});
