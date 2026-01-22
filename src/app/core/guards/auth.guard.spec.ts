import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  it('allows navigation when authenticated', () => {
    const authService = { token: 'token' } as AuthService;
    const router = { navigate: jasmine.createSpy('navigate') } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });

    const guard = TestBed.inject(AuthGuard);
    const result = guard.canActivate({} as any, { url: '/dashboard' } as any);
    expect(result).toBeTrue();
  });

  it('redirects to login when unauthenticated', () => {
    const authService = { token: null } as AuthService;
    const router = { navigate: jasmine.createSpy('navigate') } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });

    const guard = TestBed.inject(AuthGuard);
    const result = guard.canActivate({} as any, { url: '/dashboard' } as any);
    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { returnUrl: '/dashboard' } });
  });
});
