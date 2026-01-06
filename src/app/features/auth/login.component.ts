import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

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

  // Form object matching template
  form = {
    username: '',
    password: ''
  };

  // Loading state for template
  get loading() {
    return this.loadingService.isLoading();
  }

  // Method called by template
  onSubmit() {
    if (!this.form.username || !this.form.password) {
      this.toastService.showWarning('Please enter username and password');
      return;
    }

    this.http.post(`${environment.apiUrl}/auth/login`, this.form)
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
    const clientId = environment.fyersClientId;
    const redirectUri = encodeURIComponent(environment.fyersRedirectUri);
    const state = Math.random().toString(36).substring(7);
    
    // Store state for verification
    sessionStorage.setItem('fyers_state', state);
    
    // Construct Fyers OAuth URL
    const authUrl = `${environment.fyersAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
    
    console.log('Redirecting to Fyers OAuth:', authUrl);
    this.toastService.showInfo('Redirecting to Fyers authentication...');
    
    // Redirect to Fyers
    window.location.href = authUrl;
  }
}
