import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';
import { DiagnosticsConsoleComponent } from './shared/components/diagnostics-console/diagnostics-console.component';
import { AuthService } from './core/services/auth.service';
import { ModeStore } from './core/services/mode-store.service';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { DiagnosticsStoreService } from './core/services/diagnostics-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToastContainerComponent,
    GlobalLoadingComponent,
    DiagnosticsConsoleComponent
  ],
  template: `
    <div class="config-banner" *ngIf="configUnavailable$ | async">
      Backend config unavailable. {{ configErrorMessage$ | async }}
      <ng-container *ngIf="runtimeConfig$ | async as runtimeConfig">
        Falling back to API {{ runtimeConfig.apiBaseUrl }} and WS {{ runtimeConfig.wsBaseUrl || '—' }}.
      </ng-container>
    </div>
    <div class="network-banner" *ngIf="networkError$ | async as networkError">
      <div>
        <strong>Network error:</strong> {{ networkError.message }} ({{ networkError.url }})
      </div>
      <button class="btn btn-ghost btn-sm" type="button" (click)="retryNetwork()">Retry</button>
    </div>
    <div class="auth-banner" *ngIf="!isAuthenticated">
      Login required. Please authenticate to access trading data.
    </div>
    <router-outlet />
    <app-diagnostics-console />
    <app-toast-container />
    <app-global-loading />
  `,
  styles: [
    `
      .config-banner {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: rgba(239, 68, 68, 0.15);
        border-bottom: 1px solid rgba(239, 68, 68, 0.35);
        color: #fecaca;
        padding: 10px 16px;
        font-size: 13px;
        text-align: center;
      }
      .auth-banner {
        position: relative;
        background: rgba(59, 130, 246, 0.12);
        border-bottom: 1px solid rgba(59, 130, 246, 0.35);
        color: #bfdbfe;
        padding: 10px 16px;
        font-size: 13px;
        text-align: center;
      }
      .network-banner {
        position: sticky;
        top: 0;
        z-index: 1001;
        background: rgba(251, 191, 36, 0.18);
        border-bottom: 1px solid rgba(251, 191, 36, 0.45);
        color: #fcd34d;
        padding: 10px 16px;
        font-size: 13px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
      }
    `
  ]
})
export class AppComponent implements OnInit {
  title = 'Apex Trading Bot';
  readonly configUnavailable$;
  readonly configErrorMessage$;
  readonly networkError$;
  readonly runtimeConfig$;

  constructor(
    private authService: AuthService,
    private modeStore: ModeStore,
    private runtimeConfig: RuntimeConfigService,
    private diagnosticsStore: DiagnosticsStoreService
  ) {
    this.configUnavailable$ = runtimeConfig.configUnavailable$;
    this.configErrorMessage$ = runtimeConfig.configErrorMessage$;
    this.networkError$ = diagnosticsStore.networkError$;
    this.runtimeConfig$ = runtimeConfig.config$;
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    /**
     * IMPORTANT:
     * - isAuthenticated() may be true if a stale token exists in storage
     * - calling protected endpoints immediately causes 403 spam
     *
     * Correct flow:
     * 1) bootstrapSession() -> validates/loads session (or fails)
     * 2) only if bootstrap succeeds, then sync mode from backend
     */
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.authService
      .bootstrapSession()
      .pipe(
        tap(() => {
          // session is now valid/loaded
        }),
        switchMap(() => this.modeStore.syncFromBackend()),
        catchError(() => {
          // Token likely invalid/expired -> do NOT keep calling protected APIs
          // Let AuthService handle logout/redirect internally if it does.
          return EMPTY;
        })
      )
      .subscribe();
  }

  retryNetwork(): void {
    this.diagnosticsStore.clearNetworkError();
    window.location.reload();
  }
}
