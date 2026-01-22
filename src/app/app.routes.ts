import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ConfigGuard } from './core/guards/config.guard';
import { FeatureGuard } from './core/guards/feature.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { FyersCallbackComponent } from './features/auth/fyers-callback/fyers-callback.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { FeatureUnavailableComponent } from './features/feature-unavailable/feature-unavailable.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'auth/register',
    component: RegisterComponent
  },
  {
    path: 'auth/fyers-callback',
    component: FyersCallbackComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, ConfigGuard],
    children: [
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
        path: 'holdings',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/holdings/holdings.component')
          .then(m => m.HoldingsComponent)
      },
      {
        path: 'orders',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'GET', path: '/orders', label: 'Orders' } },
        loadComponent: () => import('./features/orders/orders.component')
          .then(m => m.OrdersComponent)
      },
      {
        path: 'orders/:id',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'GET', path: '/orders/{id}', label: 'Order Details' } },
        loadComponent: () => import('./features/orders/order-detail.component')
          .then(m => m.OrderDetailComponent)
      },
      {
        path: 'signals',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'GET', path: '/strategy/signals', label: 'Signals' } },
        loadComponent: () => import('./features/signals/signals.component')
          .then(m => m.SignalsComponent)
      },
      {
        path: 'scanner',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'POST', path: '/scanner/run', label: 'Scanner' } },
        loadComponent: () => import('./features/scanner/scanner.component')
          .then(m => m.ScannerComponent)
      },
      {
        path: 'watchlist',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'GET', path: '/watchlist', label: 'Watchlist' } },
        loadComponent: () => import('./features/watchlist/watchlist.component')
          .then(m => m.WatchlistComponent)
      },
      {
        path: 'risk',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/risk/risk.component')
          .then(m => m.RiskComponent)
      },
      {
        path: 'risk-correlation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/risk-correlation/risk-correlation.component')
          .then(m => m.RiskCorrelationComponent)
      },
      {
        path: 'trades',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/trades/trades.component')
          .then(m => m.TradesComponent)
      },
      {
        path: 'backtesting',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/backtesting/backtesting.component')
          .then(m => m.BacktestingComponent)
      },
      {
        path: 'backtest-validation',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/backtest-validation/backtest-validation.component')
          .then(m => m.BacktestValidationComponent)
      },
      {
        path: 'strategy',
        canActivate: [AuthGuard, FeatureGuard],
        data: { feature: { method: 'GET', path: '/strategy/health', label: 'Strategy' } },
        loadComponent: () => import('./features/strategy/strategy.component')
          .then(m => m.StrategyComponent)
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
        path: 'help',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/help/help.component')
          .then(m => m.HelpComponent)
      },
      {
        path: 'status',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/status/status.component')
          .then(m => m.StatusComponent)
      },
      {
        path: 'account',
        canActivate: [AuthGuard],
        loadComponent: () => import('./features/account/account.component')
          .then(m => m.AccountComponent)
      }
    ]
  },
  {
    path: 'feature-unavailable',
    component: FeatureUnavailableComponent
  },
  { path: '**', redirectTo: 'auth/login' }
];
