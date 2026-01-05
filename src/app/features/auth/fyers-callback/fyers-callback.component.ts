import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-fyers-callback',
  template: `<div class="loading-container"><div class="spinner-border" role="status"></div><p>Processing...</p></div>`,
  styles: [`.loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }`]
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
      this.router.navigate(['/login']);
    }
  }
}
