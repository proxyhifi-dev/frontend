import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BacktestService } from './backtest.service';
import { environment } from '../../../environments/environment';

describe('BacktestService', () => {
  let service: BacktestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(BacktestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches backtest runs', () => {
    service.getRuns().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/backtest/runs`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('runs a backtest', () => {
    service.runBacktest({ strategy: 'SMA' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/backtest/run`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'run-1' });
  });
});
