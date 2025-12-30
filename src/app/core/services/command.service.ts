import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { StoreService } from './store.service';

export interface Command {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  category: 'Navigation' | 'Action' | 'Settings';
}

@Injectable({ providedIn: 'root' })
export class CommandService {
  private isOpen = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpen.asObservable();

  commands: Command[] = [
    { id: '1', title: 'Go to Dashboard', icon: '📊', category: 'Navigation', action: () => this.router.navigate(['/dashboard']) },
    { id: '2', title: 'Go to Positions', icon: '📈', category: 'Navigation', action: () => this.router.navigate(['/positions']) },
    { id: '3', title: 'Go to Signals', icon: '⚡', category: 'Navigation', action: () => this.router.navigate(['/signals']) },
    { id: '4', title: 'Go to Risk Monitor', icon: '🛡️', category: 'Navigation', action: () => this.router.navigate(['/risk']) },
    { id: '5', title: 'Go to Settings', icon: '⚙️', category: 'Navigation', action: () => this.router.navigate(['/settings']) },
    { id: '6', title: 'Toggle Paper/Live Mode', icon: '🔄', category: 'Action', action: () => this.store.toggleMode() },
    { id: '7', title: 'Trigger Manual Scan', icon: '▶', category: 'Action', action: () => console.log('Scanning...') },
    { id: '8', title: 'Emergency Stop', icon: '🚨', category: 'Action', action: () => alert('Emergency Stop Triggered!') }
  ];

  constructor(private router: Router, private store: StoreService) {}

  toggle() {
    this.isOpen.next(!this.isOpen.value);
  }

  close() {
    this.isOpen.next(false);
  }
}
