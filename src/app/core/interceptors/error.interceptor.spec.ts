import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHandlerFn, HttpHeaders, HttpRequest } from '@angular/common/http';
import { throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { DiagnosticsStoreService } from '../services/diagnostics-store.service';
import { ScanStoreService } from '../services/scan-store.service';

describe('errorInterceptor', () => {
  it('applies cooldown and toast on 429 responses', () => {
    const toastService = { showWarning: jasmine.createSpy(), showError: jasmine.createSpy() } as Partial<ToastService>;
    const authService = { logout: jasmine.createSpy() } as Partial<AuthService>;
    const diagnosticsStore = { setLastBackendError: jasmine.createSpy() } as Partial<DiagnosticsStoreService>;
    const scanStore = { setCooldown: jasmine.createSpy() } as Partial<ScanStoreService>;

    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: toastService },
        { provide: AuthService, useValue: authService },
        { provide: DiagnosticsStoreService, useValue: diagnosticsStore },
        { provide: ScanStoreService, useValue: scanStore }
      ]
    });

    const req = new HttpRequest('POST', '/strategy/scan-now');
    const headers = new HttpHeaders({ 'Retry-After': '42' });

    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 429, headers }));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(req, next).subscribe({
        error: () => {
          // expected
        }
      });
    });

    expect(toastService.showWarning).toHaveBeenCalledWith('Rate limited. Try again in 42s');
    expect(diagnosticsStore.setLastBackendError).toHaveBeenCalledWith('Rate limited. Retry after 42s.');
    expect(scanStore.setCooldown).toHaveBeenCalledWith(42);
  });
});
