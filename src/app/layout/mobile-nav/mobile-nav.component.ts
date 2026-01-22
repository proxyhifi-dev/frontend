import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RuntimeConfigService } from '../../core/config/runtime-config.service';
import { FeatureRequirement } from '../../core/guards/feature.guard';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="mobile-nav glass-card">
      <a
        *ngFor="let item of navItems"
        [routerLink]="item.path"
        routerLinkActive="active"
        [class.disabled]="!isEnabled(item)"
        [attr.aria-disabled]="!isEnabled(item)"
        [attr.title]="getTooltip(item)"
        (click)="handleNavClick($event, item)"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.label }}</span>
      </a>
    </nav>
  `,
  styleUrls: ['./mobile-nav.component.scss']
})
export class MobileNavComponent {
  navItems: Array<{
    path: string;
    label: string;
    icon: string;
    feature?: FeatureRequirement;
  }> = [
    { path: '/dashboard', label: 'Dash', icon: '📊' },
    { path: '/watchlist', label: 'Watch', icon: '⭐', feature: { method: 'GET', path: '/watchlist' } },
    { path: '/scanner', label: 'Scan', icon: '🧭', feature: { method: 'POST', path: '/scanner/run' } },
    { path: '/signals', label: 'Signals', icon: '⚡', feature: { method: 'GET', path: '/strategy/signals' } },
    { path: '/orders', label: 'Orders', icon: '🧾', feature: { method: 'GET', path: '/orders' } },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  constructor(private runtimeConfig: RuntimeConfigService) {}

  isEnabled(item: { feature?: FeatureRequirement }): boolean {
    if (!item.feature) return true;
    const feature = item.feature;
    return feature.method
      ? this.runtimeConfig.hasEndpoint(feature.method, feature.path)
      : this.runtimeConfig.hasEndpoint(feature.path);
  }

  getTooltip(item: { feature?: FeatureRequirement }): string {
    if (!item.feature || this.isEnabled(item)) {
      return '';
    }
    return 'Backend does not expose this feature in current deployment.';
  }

  handleNavClick(event: MouseEvent, item: { feature?: FeatureRequirement }): void {
    if (!this.isEnabled(item)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
