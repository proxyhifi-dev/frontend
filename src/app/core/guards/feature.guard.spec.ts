import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FeatureGuard } from './feature.guard';
import { RuntimeConfigService } from '../config/runtime-config.service';

describe('FeatureGuard', () => {
  it('allows navigation when endpoint is available', () => {
    const runtimeConfig = {
      isConfigAvailable: () => true,
      hasEndpoint: () => true
    } as RuntimeConfigService;
    const router = { navigate: jasmine.createSpy('navigate') } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        FeatureGuard,
        { provide: RuntimeConfigService, useValue: runtimeConfig },
        { provide: Router, useValue: router }
      ]
    });

    const guard = TestBed.inject(FeatureGuard);
    const result = guard.canActivate({ data: { feature: { method: 'GET', path: '/watchlist' } } } as any);
    expect(result).toBeTrue();
  });

  it('redirects when endpoint is not available', () => {
    const runtimeConfig = {
      isConfigAvailable: () => true,
      hasEndpoint: () => false
    } as RuntimeConfigService;
    const router = { navigate: jasmine.createSpy('navigate') } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        FeatureGuard,
        { provide: RuntimeConfigService, useValue: runtimeConfig },
        { provide: Router, useValue: router }
      ]
    });

    const guard = TestBed.inject(FeatureGuard);
    const result = guard.canActivate({ data: { feature: { method: 'GET', path: '/watchlist', label: 'Watchlist' } } } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/feature-unavailable'], { queryParams: { feature: 'Watchlist' } });
  });
});
