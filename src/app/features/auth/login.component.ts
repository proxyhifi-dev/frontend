import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = { username: '', password: '' };
  loading = false;

  constructor(
    private authService: AuthService,
    private fyersService: FyersOAuthService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const authCode = this.route.snapshot.queryParamMap.get('auth_code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (authCode) {
      this.loading = true;
      this.loadingService.show();
      this.authService.handleFyersCallback(authCode, state ?? undefined)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.loadingService.hide();
          })
        )
        .subscribe({
          next: (response: any) => {
            if (response.accessToken || response.token) {
              const token = response.accessToken || response.token;
              localStorage.setItem('token', token);
              if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
              }
              this.authService.updateAuthState(response.user, token);
              this.notificationService.success('✅ Fyers account connected successfully!');
              this.router.navigate(['/dashboard'], { replaceUrl: true });
            } else if (response.message || response.requiresLogin) {
              this.notificationService.success('✅ Fyers account connected! Please login to continue.');
              this.router.navigate(['/login'], { replaceUrl: true });
            } else {
              this.notificationService.success('✅ Fyers authentication completed');
              this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
          },
          error: () => {
            this.notificationService.error('❌ Failed to connect Fyers account');
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        });
    }
  }

  onSubmit(): void {
    if (!this.form.username || !this.form.password) {
      this.notificationService.error('Please enter username and password');
      return;
    }

    this.loading = true;
    this.authService.login(this.form.username, this.form.password).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.notificationService.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading = false;
        this.notificationService.error(err.error?.error || 'Login failed');
      }
    });
  }

  loginWithFyers(): void {
    this.fyersService.getAuthUrl().subscribe({
      next: (response: any) => {
        window.location.href = response.authUrl;
      },
      error: () => {
        this.notificationService.error('Failed to initiate Fyers login');
      }
    });
  }
}
