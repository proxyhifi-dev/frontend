import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StrategyService } from './strategy.service';
import { environment } from '../../../environments/environment';

describe('StrategyService', () => {
  let service: StrategyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(StrategyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads strategy config', () => {
    service.getConfig().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/strategy/config`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('loads regime status', () => {
    service.getRegime().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/strategy/regime`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
