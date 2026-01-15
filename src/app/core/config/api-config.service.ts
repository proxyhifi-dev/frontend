import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly apiUrl = environment.apiUrl;
  readonly wsUrl = environment.wsUrl;

  buildApiUrl(path: string): string {
    if (!path) {
      return this.apiUrl;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiUrl}${normalized}`;
  }

  isApiRequest(url: string): boolean {
    return url.startsWith(this.apiUrl);
  }
}
