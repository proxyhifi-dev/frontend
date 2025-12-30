import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'positions',
    loadComponent: () => import('./features/positions/positions.component')
      .then(m => m.PositionsComponent)
  },
  {
    path: 'signals',
    loadComponent: () => import('./features/signals/signals.component')
      .then(m => m.SignalsComponent)
  },
  {
    path: 'risk',
    loadComponent: () => import('./features/risk/risk.component')
      .then(m => m.RiskComponent)
  },
  // COMMENTED OUT - Will add later
  // {
  //   path: 'analytics',
  //   loadComponent: () => import('./features/analytics/analytics.component')
  //     .then(m => m.AnalyticsComponent)
  // },
  {
    path: 'trades',
    loadComponent: () => import('./features/trades/trades.component')
      .then(m => m.TradesComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component')
      .then(m => m.SettingsComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./features/logs/logs.component')
      .then(m => m.LogsComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
