import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { FyersCallbackComponent } from './features/auth/fyers-callback/fyers-callback.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'auth/fyers-callback',
    component: FyersCallbackComponent
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'positions',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/positions/positions.component')
      .then(m => m.PositionsComponent)
  },
  {
    path: 'signals',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/signals/signals.component')
      .then(m => m.SignalsComponent)
  },
  {
    path: 'risk',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/risk/risk.component')
      .then(m => m.RiskComponent)
  },
  {
    path: 'trades',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/trades/trades.component')
      .then(m => m.TradesComponent)
  },
  {
    path: 'analytics',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/analytics/analytics.component')
      .then(m => m.AnalyticsComponent)
  },
  {
    path: 'logs',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/logs/logs.component')
      .then(m => m.LogsComponent)
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/settings/settings.component')
      .then(m => m.SettingsComponent)
  },
  {
    path: 'account',
    canActivate: [AuthGuard],
    loadComponent: () => import('./features/account/account.component')
      .then(m => m.AccountComponent)
  },
  { path: '**', redirectTo: 'login' }
];
