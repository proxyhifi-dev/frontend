import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RuntimeConfigService } from './runtime-config.service';
import { ToastService } from '../services/toast.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let httpMock: HttpTestingController;
  const toastService = { showWarning: jasmine.createSpy('showWarning') };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: ToastService, useValue: toastService }]
    });
    service = TestBed.inject(RuntimeConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads config and normalizes endpoints', () => {
    service.load().subscribe((config) => {
      expect(config.apiBaseUrl).toBe('/api');
      expect(service.hasEndpoint('GET', '/orders')).toBeTrue();
    });

    const req = httpMock.expectOne('/api/ui/config');
    req.flush({
      apiBaseUrl: '/api',
      endpoints: [{ method: 'GET', path: '/orders' }]
    });
  });

  it('falls back when config fails', () => {
    service.load().subscribe((config) => {
      expect(config.apiBaseUrl).toBe('/api');
      expect(service.isConfigAvailable()).toBeFalse();
    });

    const req = httpMock.expectOne('/api/ui/config');
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });
});
