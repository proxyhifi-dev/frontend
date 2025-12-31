import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-dropdown-wrapper">
      <button class="notification-bell" (click)="toggleDropdown()" [class.has-unread]="hasUnread">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="badge" *ngIf="hasUnread">{{ unreadCount }}</span>
      </button>

      <div class="notification-dropdown" *ngIf="isOpen" [@slideIn]>
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <button (click)="markAllRead()" class="btn-link">Mark all read</button>
        </div>

        <div class="notification-tabs">
          <button 
            *ngFor="let tab of tabs" 
            [class.active]="activeTab === tab"
            (click)="activeTab = tab"
            class="tab-btn">
            {{ tab }}
          </button>
        </div>

        <div class="notification-list">
          <div *ngIf="filteredNotifications.length === 0" class="empty-state">
            <p>No {{ activeTab.toLowerCase() }} notifications</p>
          </div>
          
          <div 
            *ngFor="let notif of filteredNotifications" 
            [class.notification-item]="true"
            [class.unread]="!notif.read"
            (click)="markAsRead(notif)">
            <div class="notification-icon" [class]="'icon-' + notif.type">
              <span>{{ getIcon(notif.type) }}</span>
            </div>
            <div class="notification-content">
              <p class="message">{{ notif.message }}</p>
              <span class="timestamp">{{ formatTime(notif.timestamp) }}</span>
            </div>
          </div>
        </div>

        <div class="dropdown-footer">
          <button (click)="clearAll()" class="btn-link">Clear all</button>
        </div>
      </div>
    </div>
  `,
  95
    [`
    .notification-dropdown-wrapper {
      position: relative;
      display: inline-block;
    }

    .notification-bell {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-primary);
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .notification-bell:hover {
      background-color: var(--bg-hover);
    }

    .notification-bell.has-unread {
      color: var(--accent);
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background-color: #ff3b30;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 380px;
      max-height: 500px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      z-index: 1000;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
    }

    .dropdown-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--accent);
      cursor: pointer;
      font-size: 12px;
      padding: 0;
      transition: opacity 0.2s;
    }

    .btn-link:hover {
      opacity: 0.8;
    }

    .notification-tabs {
      display: flex;
      padding: 8px 16px;
      gap: 4px;
      border-bottom: 1px solid var(--border-color);
    }

    .tab-btn {
      padding: 6px 12px;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: var(--text-secondary);
      transition: all 0.2s;
    }

    .tab-btn.active {
      background-color: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .notification-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .empty-state {
      padding: 32px 16px;
      text-align: center;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .notification-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: var(--bg-hover);
    }

    .notification-item.unread {
      background-color: rgba(76, 175, 80, 0.05);
    }

    .notification-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }

    .icon-success {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .icon-error {
      background-color: rgba(255, 59, 48, 0.2);
      color: #ff3b30;
    }

    .icon-warning {
      background-color: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }

    .icon-info {
      background-color: rgba(33, 150, 243, 0.2);
      color: #2196f3;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .message {
      margin: 0;
      font-size: 13px;
      color: var(--text-primary);
      word-wrap: break-word;
    }

    .timestamp {
      font-size: 11px;
      color: var(--text-secondary);
      display: block;
      margin-top: 4px;
    }

    .dropdown-footer {
      padding: 8px 16px;
      border-top: 1px solid var(--border-color);
      text-align: right;
    }
  260

   animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  activeTab: 'All' | 'Success' | 'Error' = 'All';
  tabs: ('All' | 'Success' | 'Error')[] = ['All', 'Success', 'Error'];
  notifications: Notification[] = [];
  unreadCount = 0;
  hasUnread = false;

  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Subscribe to notifications from service
    // For now, using mock data - replace with actual service call
    this.notifications = [
      {
        id: '1',
        type: 'success',
        message: 'Bot started successfully',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        message: 'Daily loss limit approaching',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'error',
        message: 'Failed to execute trade',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true
      }
    ];
    this.updateUnreadCount();
  }

  get filteredNotifications(): Notification[] {
    return this.notifications.filter(n => {
      if (this.activeTab === 'All') return true;
      if (this.activeTab === 'Success') return n.type === 'success';
      if (this.activeTab === 'Error') return n.type === 'error';
      return true;
    });
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  markAsRead(notification: Notification): void {
    notification.read = true;
    this.updateUnreadCount();
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.updateUnreadCount();
  }

  clearAll(): void {
    this.notifications = [];
    this.isOpen = false;
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    this.hasUnread = this.unreadCount > 0;
  }

  getIcon(type: string): string {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
