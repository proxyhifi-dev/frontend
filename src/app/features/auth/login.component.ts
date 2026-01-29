// src/app/features/auth/login.component.ts

import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, timeout, TimeoutError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingService } from '../../core/services/loading.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { AuthResponse } from '../../core/models/auth.model';
import { environment } from '../../../environments/environment';
import { mapHttpError } from '../../core/utils/api-error';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  form = { email: '', password: '' };
  devForm = { username: '', password: '' };
  loading = false;
  fyersLoading = false;
  fyersStatus = '';
  isDevMode = environment.enableDevTools;
  private authCode?: string | null;
  private authState?: string;

  constructor(
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
    private readonly loadingService: LoadingService,
    private readonly modeStore: ModeStore,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authCode = this.route.snapshot.queryParamMap.get('auth_code');
    this.authState = this.route.snapshot.queryParamMap.get('state') ?? undefined;
  }

  ngAfterViewInit(): void {
    if (!this.authCode) {
      return;
    }
    this.startFyersCallback(this.authCode, this.authState);
  }

  private startFyersCallback(authCode: string, state?: string): void {
    this.loading = true;
    this.fyersLoading = true;
    this.fyersStatus = 'Completing FYERS authentication...';
    this.loadingService.show();
    this.cdr.detectChanges();

    this.authService
      .handleFyersCallback(authCode, state)
      .pipe(
        timeout(5000),
        finalize(() => {
          this.loading = false;
          this.fyersLoading = false;
          this.loadingService.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: AuthResponse) => {
          const token = response?.accessToken || response?.token;

          this.authService.updateAuthState(response?.user ?? null, token ?? '', response?.refreshToken);

          if (token) {
            this.modeStore.syncFromBackend().subscribe();
            this.notificationService.success('✅ Fyers account connected successfully!');
            this.fyersStatus = 'FYERS connected. Redirecting...';
            this.router.navigate(['/dashboard'], { replaceUrl: true });
            return;
          }

          if (response?.message || response?.requiresLogin) {
            this.notificationService.success('✅ Fyers account connected! Please login to continue.');
            this.fyersStatus = 'FYERS connected. Please login to continue.';
            this.router.navigate(['/auth/login'], { replaceUrl: true });
            return;
          }

          this.notificationService.success('✅ Fyers authentication completed');
          this.fyersStatus = 'FYERS authentication completed.';
          this.modeStore.syncFromBackend().subscribe();
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: (err: unknown) => {
          if (err instanceof TimeoutError) {
            this.notificationService.error('FYERS authentication timed out.');
            this.fyersStatus = 'FYERS authentication timed out. Please try again.';
            return;
          }
          const apiError =
            err instanceof HttpErrorResponse ? mapHttpError(err) : { userMessage: 'FYERS authentication failed.' };
          const statusLabel =
            (err as { status?: number })?.status ? ` (HTTP ${(err as { status?: number })?.status})` : '';
          this.notificationService.error('❌ Failed to connect Fyers account');
          this.fyersStatus = `${apiError.userMessage}${statusLabel}`;
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        },
      });
  }

  onSubmit(): void {
    if (!this.form.email || !this.form.password) {
      this.notificationService.error('Please enter email and password');
      return;
    }

    this.loading = true;
    this.authService
      .login(this.form.email, this.form.password)
      .pipe(
        timeout(5000),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Login successful!');
          this.modeStore.syncFromBackend().subscribe();
          this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          if (err instanceof TimeoutError) {
            this.notificationService.error('Login timed out. Please try again.');
            return;
          }
          const message = (err as { userMessage?: string })?.userMessage ?? 'Login failed';
          this.notificationService.error(message);
        },
      });
  }

  loginWithFyers(): void {
    this.fyersLoading = true;
    this.fyersStatus = 'Requesting FYERS login URL...';
    this.authService
      .loginWithFyers()
      .pipe(
        timeout(5000),
        finalize(() => {
          this.fyersLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.fyersStatus = 'Redirecting to FYERS...';
        },
        error: (err: unknown) => {
          if (err instanceof TimeoutError) {
            this.fyersStatus = 'FYERS login request timed out. Please retry.';
            this.notificationService.error('FYERS login request timed out.');
            return;
          }
          if (err instanceof HttpErrorResponse) {
            const apiError = mapHttpError(err);
            if (err.status === 401 || err.status === 403) {
              this.fyersStatus = `${apiError.userMessage} (HTTP ${err.status})`;
              this.notificationService.error('Session expired / unauthorized');
              return;
            }
            if (err.status >= 500) {
              this.fyersStatus = `FYERS login service error (HTTP ${err.status}).`;
              this.notificationService.error('FYERS login service error.');
              return;
            }
            this.fyersStatus = `${apiError.userMessage} (HTTP ${err.status || 'network'})`;
            this.notificationService.error(apiError.userMessage);
            return;
          }
          this.fyersStatus = 'Failed to initiate FYERS login.';
          this.notificationService.error('Failed to initiate Fyers login');
        }
      });
  }

  devLogin(): void {
    this.loading = true;
    this.authService
      .devLogin(this.devForm.username, this.devForm.password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Dev login successful.');
          this.modeStore.syncFromBackend().subscribe();
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.notificationService.error('Dev login failed.');
        }
      });
  }
}
