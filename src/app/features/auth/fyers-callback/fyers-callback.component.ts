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
      
      if (authCode) {
        this.authService.handleFyersCallback(authCode).subscribe({
          next: () => {
            this.notificationService.success('Fyers account connected successfully!');
            this.router.navigate(['/dashboard']);
          },
          error: (err: any) => {
            this.notificationService.error('Failed to connect Fyers account');
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.notificationService.error('Invalid callback');
        this.router.navigate(['/login']);
      }
    });
  }
}
