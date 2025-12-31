import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor() {}

  // Standard method for success notifications
  success(title: string, message: string): void {
    console.log(`✅ SUCCESS: [${title}] ${message}`);
    // You can replace this with a proper Toast/Snackbar later
    alert(`${title}\n${message}`);
  }

  // Standard method for error notifications
  error(title: string, message: string): void {
    console.error(`❌ ERROR: [${title}] ${message}`);
    // You can replace this with a proper Toast/Snackbar later
    alert(`${title}\n${message}`);
  }

  // Keeping these for backward compatibility with your interceptor
  showError(message: string): void {
    this.error('System Error', message);
  }

  showSuccess(message: string): void {
    this.success('Success', message);
  }
}
