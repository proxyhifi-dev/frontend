import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ToastService } from '../services/toast.service';

@Injectable({ providedIn: 'root' })
export class ConfigGuard implements CanActivate {
  constructor(
    private runtimeConfig: RuntimeConfigService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(): boolean {
    if (this.runtimeConfig.isConfigAvailable()) {
      return true;
    }
    this.toastService.showWarning('Backend config unavailable. Please log in once config is reachable.');
    this.router.navigate(['/auth/login']);
    return false;
  }
}
