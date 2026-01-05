import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { FyersOAuthService } from '../../../core/services/fyers-oauth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading$ = this.loadingService.loading$;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private fyersOAuthService: FyersOAuthService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.error('Please fill in all fields');
      return;
    }

    const { username, password } = this.loginForm.value;
    this.authService.login(username, password).subscribe({
      next: (response: any) => {
        this.notificationService.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.error || 'Invalid credentials. Please try again.');
      }
    });
  }

  loginWithFyers(): void {
    this.fyersOAuthService.getAuthUrl().subscribe({
      next: (response) => {
        window.location.href = response.authUrl;
      },
      error: () => {
        this.notificationService.error('Failed to initiate Fyers login');
      }
    });
  }
}
