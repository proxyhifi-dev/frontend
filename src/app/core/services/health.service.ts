import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService, RuntimeEndpoint } from '../config/runtime-config.service';

export interface HealthComponent {
  status?: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  components?: Record<string, HealthComponent>;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getHealth(): Observable<HealthResponse | null> {
    const endpoint = this.pickHealthEndpoint();
    if (!endpoint) {
      return of(null);
    }
    return this.http.get<HealthResponse>(endpoint.path);
  }

  private pickHealthEndpoint(): RuntimeEndpoint | null {
    const endpoints = this.runtimeConfig.listEndpoints();
    const preferred = endpoints.find((endpoint) => endpoint.path.includes('/actuator/health'));
    if (preferred) {
      return preferred;
    }
    const fallback = endpoints.find((endpoint) => endpoint.path.endsWith('/health'));
    if (fallback) {
      return fallback;
    }
    return endpoints.find((endpoint) => endpoint.path.endsWith('/status')) ?? null;
  }
}
