import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface FeatureRequirement {
  method?: string;
  path: string;
  label?: string;
}

@Injectable({ providedIn: 'root' })
export class FeatureGuard implements CanActivate {
  constructor(private runtimeConfig: RuntimeConfigService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const feature = route.data['feature'] as FeatureRequirement | undefined;

    if (!feature) {
      return true;
    }

    if (!this.runtimeConfig.isConfigAvailable()) {
      this.router.navigate(['/feature-unavailable'], { queryParams: { feature: feature.label ?? feature.path } });
      return false;
    }

    const isAvailable = feature.method
      ? this.runtimeConfig.hasEndpoint(feature.method, feature.path)
      : this.runtimeConfig.hasEndpoint(feature.path);

    if (!isAvailable) {
      this.router.navigate(['/feature-unavailable'], { queryParams: { feature: feature.label ?? feature.path } });
      return false;
    }

    return true;
  }
}
