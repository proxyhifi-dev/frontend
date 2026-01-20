import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';
import { AuthService } from './core/services/auth.service';
import { ModeStore } from './core/services/mode-store.service';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, GlobalLoadingComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-global-loading />
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'Apex Trading Bot';

  constructor(
    private authService: AuthService,
    private modeStore: ModeStore
  ) {}

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
