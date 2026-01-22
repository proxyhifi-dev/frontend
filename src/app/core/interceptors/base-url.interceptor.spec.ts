import { TestBed } from '@angular/core/testing';
import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { baseUrlInterceptor } from './base-url.interceptor';
import { RuntimeConfigService } from '../config/runtime-config.service';

describe('baseUrlInterceptor', () => {
  it('prefixes /api requests with runtime base URL', () => {
    const runtimeConfig = {
      getApiBaseUrl: () => 'https://example.com/api'
    } as RuntimeConfigService;

    TestBed.configureTestingModule({
      providers: [{ provide: RuntimeConfigService, useValue: runtimeConfig }]
    });

    const req = new HttpRequest('GET', '/api/orders');
    let capturedUrl = '';

    const next: HttpHandlerFn = (request) => {
      capturedUrl = request.url;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      baseUrlInterceptor(req, next).subscribe();
    });

    expect(capturedUrl).toBe('https://example.com/api/orders');
  });
});
