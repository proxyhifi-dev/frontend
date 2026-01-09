import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
      <a routerLink="/trades" routerLinkActive="active">
        <span class="icon">🔁</span>
        <span class="label">Trades</span>
      </a>
      <a routerLink="/signals" routerLinkActive="active">
        <span class="icon">⚡</span>
        <span class="label">Signals</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active">
        <span class="icon">⚙️</span>
        <span class="label">Settings</span>
      </a>
    </nav>
  `,
  styleUrls: ['./mobile-nav.component.scss']
})
export class MobileNavComponent {
  constructor() {}
}
