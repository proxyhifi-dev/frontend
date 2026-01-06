import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);

  credentials = {
    email: '',
    password: ''
  };

  // Use signal instead of Observable
  get isLoading() {
    return this.loadingService.isLoading();
  }

  login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.toastService.showWarning('Please enter email and password');
      return;
    }

    this.http.post('/api/auth/login', this.credentials)
      .subscribe({
        next: (response: any) => {
          localStorage.setItem('token', response.token);
          this.toastService.showSuccess('Login successful!');
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          // Error is handled by interceptor
        }
      });
  }

  loginWithFyers() {
    const clientId = 'YOUR_FYERS_CLIENT_ID';
    const redirectUri = encodeURIComponent('http://localhost:4200/auth/fyers/callback');
    const state = Math.random().toString(36).substring(7);
    
    sessionStorage.setItem('fyers_state', state);
    
    const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
    window.location.href = authUrl;
  }
}
