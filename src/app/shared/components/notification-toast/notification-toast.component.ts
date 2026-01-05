import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from 'src/app/core/services/notification.service';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class NotificationToastComponent implements OnInit {
  toasts: Toast[] = [];
  private toastTimeout = 5000;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notification$.subscribe((notification: any) => {
      if (notification) {
        const toast: Toast = {
          id: Date.now().toString(),
          message: notification.message,
          type: notification.type || 'info'
        };
        this.toasts.push(toast);
        setTimeout(() => this.removeToast(toast.id), this.toastTimeout);
      }
    });
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
