import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';
import { AuthService } from './core/services/auth.service';
import { ModeStore } from './core/services/mode-store.service';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { RuntimeConfigService } from './core/config/runtime-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastContainerComponent, GlobalLoadingComponent],
  template: `
    <div class="config-banner" *ngIf="configUnavailable$ | async">
      Backend config unavailable. Running in limited mode (login only) until /api/ui/config is reachable.
    </div>
    <router-outlet />
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
    `
  ]
})
export class AppComponent implements OnInit {
  title = 'Apex Trading Bot';
  readonly configUnavailable$;

  constructor(
    private authService: AuthService,
    private modeStore: ModeStore,
    private runtimeConfig: RuntimeConfigService
  ) {
    this.configUnavailable$ = runtimeConfig.configUnavailable$;
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
}
