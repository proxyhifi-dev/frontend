import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-fyers-callback',
  template: `<div class="loading-container"><div class="spinner"></div><p>Processing...</p></div>`,
  styles: [`
    .loading-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      background: #f5f5f5;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    p { margin-top: 20px; font-size: 16px; color: #666; }
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
    const authCode = this.route.snapshot.queryParams['auth_code'];
    
    if (authCode) {
      this.authService.handleFyersCallback(authCode).subscribe({
        next: (response: any) => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.notificationService.success('Fyers account connected successfully');
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.notificationService.error('Failed to connect Fyers account');
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.notificationService.error('Invalid callback');
      this.router.navigate(['/login']);
    }
  }
}
