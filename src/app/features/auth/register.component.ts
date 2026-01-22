import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = { email: '', username: '', password: '', confirmPassword: '' };
  loading = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.password !== this.form.confirmPassword) {
      this.notificationService.error('Passwords do not match');
      return;
    }

    this.loading = true;
    this.authService.register(this.form.email, this.form.username, this.form.password).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.success('Registration successful! Please login.');
        this.router.navigate(['/auth/login']);
      },
      error: (err: unknown) => {
        this.loading = false;
        const message = err instanceof Error ? err.message : 'Registration failed';
        this.notificationService.error(message);
      }
    });
  }
}
