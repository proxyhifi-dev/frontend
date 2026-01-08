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
  private readonly modeStorageKey = 'apex.mode';
  private initialState: AppState = {
    isLiveMode: false, // Default to Paper Trading
    isSidebarCollapsed: false,
    notifications: [],
    user: { name: 'Trader', capital: 100000 },
    searchSymbol: ''
  };

  private state = new BehaviorSubject<AppState>(this.loadInitialState());
  state$ = this.state.asObservable();

  // ✅ Expose snapshot for services to check mode synchronously
  get snapshot(): AppState {
    return this.state.getValue();
  }

  toggleMode() {
    const current = this.state.value;
    const newMode = !current.isLiveMode;
    this.state.next({ ...current, isLiveMode: newMode });
    this.persistMode(newMode);

    this.notify(
      newMode ? 'Live Mode Enabled' : 'Paper Mode Active',
      newMode ? 'Real orders will be sent to broker.' : 'Simulated trading environment.',
      newMode ? 'warning' : 'info'
    );
  }

  setMode(isLiveMode: boolean) {
    const current = this.state.value;
    if (current.isLiveMode === isLiveMode) {
      return;
    }
    this.state.next({ ...current, isLiveMode });
    this.persistMode(isLiveMode);
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

  private loadInitialState(): AppState {
    const savedMode = localStorage.getItem(this.modeStorageKey);
    const isLiveMode = savedMode === 'true';
    return { ...this.initialState, isLiveMode };
  }

  private persistMode(isLiveMode: boolean) {
    localStorage.setItem(this.modeStorageKey, String(isLiveMode));
  }
}
