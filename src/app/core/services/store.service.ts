import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppState {
  isLiveMode: boolean;
  isSidebarCollapsed: boolean;
  notifications: any[];
  user: { name: string; capital: number };
  searchSymbol: string;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private initialState: AppState = {
    isLiveMode: false, // Default to Paper Trading
    isSidebarCollapsed: false,
    notifications: [],
    user: { name: 'Trader', capital: 100000 },
    searchSymbol: ''
  };

  private state = new BehaviorSubject<AppState>(this.initialState);
  state$ = this.state.asObservable();

  // ✅ Expose snapshot for services to check mode synchronously
  get snapshot(): AppState {
    return this.state.getValue();
  }

  setMode(isLiveMode: boolean) {
    const current = this.state.value;
    if (current.isLiveMode === isLiveMode) {
      return;
    }
    this.state.next({ ...current, isLiveMode });
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
    const note = { id: Date.now().toString(), title, message, type, timestamp: new Date() };
    this.state.next({ ...current, notifications: [note, ...current.notifications] });
  }
}
