import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Notification } from './notification.service';

export interface AppState {
  isSidebarCollapsed: boolean;
  notifications: Notification[];
  user: { name: string; capital: number };
  searchSymbol: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private initialState: AppState = {
    isSidebarCollapsed: false,
    notifications: [],
    user: { name: 'Trader', capital: 100000 },
    searchSymbol: ''
  };

  private state = new BehaviorSubject<AppState>(this.initialState);
  state$ = this.state.asObservable();

  // ✅ Expose snapshot for synchronous state access
  get snapshot(): AppState {
    return this.state.getValue();
  }

  toggleSidebar() {
    const current = this.state.value;
    this.state.next({ ...current, isSidebarCollapsed: !current.isSidebarCollapsed });
  }

  setSearchSymbol(symbol: string) {
    const current = this.state.value;
    this.state.next({ ...current, searchSymbol: symbol });
  }

  notify(title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    const current = this.state.value;
    const note: Notification = {
      id: Date.now().toString(),
      type,
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.state.next({ ...current, notifications: [note, ...current.notifications] });
  }
}
