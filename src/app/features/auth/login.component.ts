// src/app/features/auth/login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingService } from '../../core/services/loading.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { AuthResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form = { email: '', password: '' };
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly fyersService: FyersOAuthService,
    private readonly notificationService: NotificationService,
    private readonly loadingService: LoadingService,
    private readonly modeStore: ModeStore,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const authCode = this.route.snapshot.queryParamMap.get('auth_code');
    const state = this.route.snapshot.queryParamMap.get('state') ?? undefined;

    if (!authCode) return;

    this.loading = true;
    this.loadingService.show();

    this.authService
      .handleFyersCallback(authCode, state)
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.loading = false;
            this.loadingService.hide();
          });
        })
      )
      .subscribe({
        next: (response: AuthResponse) => {
          const token = response?.accessToken || response?.token;

          this.authService.updateAuthState(response?.user ?? null, token ?? '', response?.refreshToken);

          if (token) {
            this.modeStore.syncFromBackend().subscribe();
            this.notificationService.success('✅ Fyers account connected successfully!');
            this.router.navigate(['/dashboard'], { replaceUrl: true });
            return;
          }

          if (response?.message || response?.requiresLogin) {
            this.notificationService.success('✅ Fyers account connected! Please login to continue.');
            this.router.navigate(['/login'], { replaceUrl: true });
            return;
          }

          this.notificationService.success('✅ Fyers authentication completed');
          this.modeStore.syncFromBackend().subscribe();
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: () => {
          this.notificationService.error('❌ Failed to connect Fyers account');
          this.router.navigate(['/login'], { replaceUrl: true });
        },
      });
  }

  onSubmit(): void {
    if (!this.form.email || !this.form.password) {
      this.notificationService.error('Please enter email and password');
      return;
    }

    this.loading = true;
    this.authService.login(this.form.email, this.form.password)
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.loading = false;
          });
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.success('Login successful!');
          this.modeStore.syncFromBackend().subscribe();
          this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Login failed';
          this.notificationService.error(message);
        },
      });
  }

  loginWithFyers(): void {
    this.fyersService.getAuthUrl().subscribe({
      next: (response) => {
        if (response.authUrl) {
          window.location.href = response.authUrl;
        } else {
          this.notificationService.error('Fyers auth URL unavailable.');
        }
      },
      error: () => {
        this.notificationService.error('Failed to initiate Fyers login');
      },
    });
  }
}
