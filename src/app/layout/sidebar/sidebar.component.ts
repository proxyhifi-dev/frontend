import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RuntimeConfigService } from '../../core/config/runtime-config.service';
import { FeatureRequirement } from '../../core/guards/feature.guard';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'] // Ensure this SCSS file also exists
})
export class SidebarComponent {
  @Input() collapsed = false;

  navItems: Array<{
    path: string;
    label: string;
    icon: string;
    feature?: FeatureRequirement;
  }> = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/watchlist', label: 'Watchlist', icon: '⭐', feature: { method: 'GET', path: '/watchlist' } },
    { path: '/scanner', label: 'Scanner', icon: '🧭', feature: { method: 'POST', path: '/scanner/run' } },
    { path: '/signals', label: 'Signals', icon: '⚡', feature: { method: 'GET', path: '/strategy/signals' } },
    { path: '/orders', label: 'Orders', icon: '🧾', feature: { method: 'GET', path: '/orders' } },
    { path: '/account', label: 'Paper Account', icon: '💼' },
    { path: '/risk-correlation', label: 'Risk & Correlation', icon: '🛡️' },
    { path: '/strategy', label: 'Strategy', icon: '🧠', feature: { method: 'GET', path: '/strategy/health' } },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/status', label: 'Status', icon: '✅' }
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
