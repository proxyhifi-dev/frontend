import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ModeStore } from './mode-store.service';
import { SignalService } from './signal.service';
import { RiskService } from './risk.service';
import { NotificationService } from './notification.service';

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
    { id: '6', title: 'Toggle Paper/Live Mode', icon: '🔄', category: 'Action', action: () => this.toggleMode() },
    { id: '7', title: 'Trigger Manual Scan', icon: '▶', category: 'Action', action: () => this.triggerScan() },
    { id: '8', title: 'Emergency Stop', icon: '🚨', category: 'Action', action: () => this.triggerEmergencyStop() }
  ];

  constructor(
    private router: Router,
    private modeStore: ModeStore,
    private signalService: SignalService,
    private riskService: RiskService,
    private notificationService: NotificationService
  ) {}

  toggle() {
    this.isOpen.next(!this.isOpen.value);
  }

  close() {
    this.isOpen.next(false);
  }

  private toggleMode(): void {
    if (!this.modeStore.modeSupported) {
      this.notificationService.warning('Mode switching not supported by current backend.', 'Mode Locked');
      return;
    }
    const nextMode = this.modeStore.snapshot === 'LIVE' ? 'PAPER' : 'LIVE';
    this.modeStore.setMode(nextMode).subscribe();
  }

  private triggerScan(): void {
    this.signalService.scanNow().subscribe({
      next: () => this.notificationService.success('Scan Started', 'Manual scan triggered.'),
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to start scan.';
        this.notificationService.error('Scan Failed', message);
      }
    });
  }

  private triggerEmergencyStop(): void {
    this.riskService.triggerEmergencyStop().subscribe({
      next: () => this.notificationService.warning('Emergency Stop', 'Risk kill switch activated.'),
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to trigger emergency stop.';
        this.notificationService.error('Emergency Stop Failed', message);
      }
    });
  }
}
