import { Injectable } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  constructor(private runtimeConfig: RuntimeConfigService) {}

  get apiUrl(): string {
    return this.runtimeConfig.apiBaseUrl;
  }

  get wsUrl(): string {
    return this.runtimeConfig.wsUrl;
  }

  buildApiUrl(path: string): string {
    if (!path) {
      return this.runtimeConfig.apiBaseUrl;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.runtimeConfig.apiBaseUrl}${normalized}`;
  }

  isApiRequest(url: string): boolean {
    return url.startsWith(this.runtimeConfig.apiBaseUrl);
  }
}
