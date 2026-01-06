import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { FyersCallbackComponent } from './features/auth/fyers-callback/fyers-callback.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LogsComponent } from './features/logs/logs.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'auth/fyers/callback', component: FyersCallbackComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'logs', component: LogsComponent },
  // Add other routes here
  { path: '**', redirectTo: '/login' }
];
