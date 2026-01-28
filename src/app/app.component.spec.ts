import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { ModeStore } from './core/services/mode-store.service';
import { DiagnosticsStoreService } from './core/services/diagnostics-store.service';
import { RuntimeConfig, RuntimeConfigService } from './core/config/runtime-config.service';

describe('AppComponent', () => {
  it('shows runtime config fallback banner with error and fallback values', () => {
    const configUnavailable$ = new BehaviorSubject<boolean>(true);
    const configErrorMessage$ = new BehaviorSubject<string>('HTTP 500: server error');
    const config$ = new BehaviorSubject<RuntimeConfig>({
      apiBaseUrl: 'http://localhost:8080/api',
      wsBaseUrl: 'ws://localhost:8080/ws',
      wsTopics: [],
      endpoints: [],
      entities: []
    });
    const networkError$ = new BehaviorSubject(null);

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            bootstrapSession: () => of(null)
          }
        },
        {
          provide: ModeStore,
          useValue: {
            syncFromBackend: () => of(null)
          }
        },
        {
          provide: DiagnosticsStoreService,
          useValue: {
            networkError$,
            clearNetworkError: () => undefined
          }
        },
        {
          provide: RuntimeConfigService,
          useValue: {
            configUnavailable$,
            configErrorMessage$,
            config$
          }
        }
      ]
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.config-banner') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('HTTP 500: server error');
    expect(banner.textContent).toContain('http://localhost:8080/api');
    expect(banner.textContent).toContain('ws://localhost:8080/ws');
  });
});
