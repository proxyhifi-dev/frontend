import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationSubject.asObservable();

  // Standard method for success notifications
  success(message: string, title: string = 'Success'): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // Standard method for error notifications
  error(message: string, title: string = 'Error'): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // Warning notifications
  warning(message: string, title: string = 'Warning'): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // Info notifications
  info(message: string, title: string = 'Info'): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // Keeping these for backward compatibility
  showError(message: string): void {
    this.error(message);
  }

  showSuccess(message: string): void {
    this.success(message);
  }

  // Internal method to add a notification and emit it
  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationSubject.value;
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Keep last 50
    this.notificationSubject.next(updatedNotifications);
  }

  // Mark a notification as read
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notificationSubject.value.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationSubject.next(currentNotifications);
  }

  // Clear all notifications
  clearAll(): void {
    this.notificationSubject.next([]);
  }

  // Generate unique ID for notifications
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
