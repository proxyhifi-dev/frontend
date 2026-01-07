import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SignalService } from '../../core/services/signal.service';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mobile-nav glass-card">
      <a routerLink="/dashboard" routerLinkActive="active">
        <span class="icon">📊</span>
        <span class="label">Dash</span>
      </a>
      <a routerLink="/positions" routerLinkActive="active">
        <span class="icon">📈</span>
        <span class="label">Pos</span>
      </a>
      <div class="scan-btn-wrapper">
        <button class="scan-fab" type="button" (click)="triggerScan()" [disabled]="isScanning" aria-label="Trigger manual scan">▶</button>
      </div>
      <a routerLink="/signals" routerLinkActive="active">
        <span class="icon">⚡</span>
        <span class="label">Sig</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active">
        <span class="icon">⚙️</span>
        <span class="label">Set</span>
      </a>
    </nav>
  `,
  styleUrls: ['./mobile-nav.component.scss']
})
export class MobileNavComponent {
  isScanning = false;

  constructor(
    private signalSvc: SignalService,
    private notify: NotificationService,
    private router: Router
  ) {}

  triggerScan(): void {
    if (this.isScanning) return;

    this.isScanning = true;
    this.signalSvc
      .scanNow()
      .pipe(finalize(() => (this.isScanning = false)))
      .subscribe({
        next: () => {
          this.notify.success('Manual scan triggered.');
          this.router.navigate(['/signals']);
        },
        error: (err: any) => {
          this.notify.error(err?.message || 'Scan failed');
        }
      });
  }
}
