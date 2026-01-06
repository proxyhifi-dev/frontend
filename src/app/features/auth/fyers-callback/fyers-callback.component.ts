import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fyers-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        @if (isProcessing) {
          <div class="processing">
            <div class="spinner"></div>
            <h2>Processing Fyers Authentication...</h2>
            <p>Please wait while we complete your login</p>
          </div>
        } @else if (error) {
          <div class="error">
            <div class="error-icon">❌</div>
            <h2>Authentication Failed</h2>
            <p class="error-message">{{ error }}</p>
            <button (click)="goToLogin()" class="btn btn-primary">Back to Login</button>
          </div>
        } @else {
          <div class="success">
            <div class="success-icon">✅</div>
            <h2>Authentication Successful!</h2>
            <p>Redirecting to dashboard...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .callback-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .processing, .error, .success {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon, .success-icon {
      font-size: 60px;
    }

    h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .error-message {
      color: #ef4444;
      font-weight: 500;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }
  `]
})
export class FyersCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  isProcessing = true;
  error: string | null = null;

  ngOnInit() {
    this.handleCallback();
  }

  private handleCallback() {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      const authCode = params['auth_code'];
      const state = params['state'];
      const errorMsg = params['error_msg'];

      // Check for errors from Fyers
      if (errorMsg) {
        this.handleError(`Fyers authentication error: ${errorMsg}`);
        return;
      }

      // Validate state (CSRF protection)
      const storedState = sessionStorage.getItem('fyers_state');
      if (state !== storedState) {
        this.handleError('Invalid state parameter. Possible CSRF attack.');
        return;
      }

      // Check if we got the auth code
      if (!authCode) {
        this.handleError('No authorization code received from Fyers');
        return;
      }

      // Send auth code to backend to exchange for access token
      this.exchangeAuthCode(authCode);
    });
  }

  private exchangeAuthCode(authCode: string) {
    const payload = {
      authCode: authCode,
      clientId: environment.fyersClientId,
      secretId: environment.fyersSecretId,
      redirectUri: environment.fyersRedirectUri
    };

    this.http.post(`${environment.apiUrl}/auth/fyers/callback`, payload)
      .subscribe({
        next: (response: any) => {
          // Store access token
          localStorage.setItem('token', response.token);
          localStorage.setItem('fyers_access_token', response.fyersAccessToken);
          
          // Clear state
          sessionStorage.removeItem('fyers_state');
          
          // Success!
          this.isProcessing = false;
          this.toastService.showSuccess('Fyers authentication successful!');
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (err) => {
          const errorMessage = err.error?.message || 'Failed to authenticate with Fyers';
          this.handleError(errorMessage);
        }
      });
  }

  private handleError(message: string) {
    this.isProcessing = false;
    this.error = message;
    this.toastService.showError(message);
    console.error('Fyers authentication error:', message);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
