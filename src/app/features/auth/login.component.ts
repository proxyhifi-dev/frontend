import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
export class LoginComponent {
  form = { username: '', password: '' };
  loading = false;

  constructor(
    private authService: AuthService,
    private fyersService: FyersOAuthService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  get loading$() {
    return this.loadingService.loading$;
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
