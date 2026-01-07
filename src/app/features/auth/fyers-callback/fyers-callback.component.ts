import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-fyers-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <div class="spinner"></div>
      <p>Authenticating with Fyers...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #0f172a;
      color: white;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class FyersCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: any) => {
      const authCode = params['auth_code'];
      const state = params['state'];
      
      if (authCode) {
        this.authService.handleFyersCallback(authCode, state).subscribe({
          next: (response: any) => {
            // Check if response contains JWT token (new flow)
            if (response.accessToken || response.token) {
              // Save JWT token and user profile
              const token = response.accessToken || response.token;
              localStorage.setItem('token', token);
              
              if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
              }
              
              // Update auth service state
              this.authService.updateAuthState(response.user, token);
              
              this.notificationService.success('✅ Fyers account connected successfully!');
              
              // Navigate to dashboard
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
            } 
            // Legacy flow: message-only response (requires login)
            else if (response.message || response.requiresLogin) {
              this.notificationService.success('✅ Fyers account connected! Please login to continue.');
              
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 1500);
            }
            // Unknown response format
            else {
              this.notificationService.success('✅ Fyers authentication completed');
              
              setTimeout(() => {
                this.router.navigate(['/dashboard']);
              }, 1000);
            }
          },
          error: () => {
            console.error('Fyers callback error.');
            this.notificationService.error('❌ Failed to connect Fyers account');
            
            // Redirect to login page on error
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        });
      } else {
        this.notificationService.error('Invalid callback: Missing auth code');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      }
    });
  }
}
