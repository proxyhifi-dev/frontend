import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';
import { AuthService } from './core/services/auth.service';
import { TradingModeService } from './core/services/trading-mode.service';

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
    private tradingModeService: TradingModeService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.tradingModeService.syncModeFromBackend().subscribe();
    }
  }
}
