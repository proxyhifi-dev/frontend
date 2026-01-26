import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService, RuntimeEndpoint } from '../config/runtime-config.service';

@Injectable({ providedIn: 'root' })
export class BackendLogsService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  isSupported(): boolean {
    return this.pickEndpoint() !== null;
  }

  getLogs(): Observable<string[] | null> {
    const endpoint = this.pickEndpoint();
    if (!endpoint) {
      return of(null);
    }
    return this.http.get<unknown>(endpoint.path).pipe(map((response) => this.normalizeLogs(response)));
  }

  private pickEndpoint(): RuntimeEndpoint | null {
    const endpoints = this.runtimeConfig.listEndpoints();
    const match = endpoints.find((endpoint) => endpoint.path.includes('/logs'));
    if (match) {
      return match;
    }
    return endpoints.find((endpoint) => endpoint.path.includes('/log')) ?? null;
  }

  private normalizeLogs(response: unknown): string[] {
    if (!response) {
      return [];
    }
    if (Array.isArray(response)) {
      return response.map((line) => String(line));
    }
    if (typeof response === 'string') {
      return response.split('\n').filter((line) => line.trim().length > 0);
    }
    if (typeof response === 'object') {
      const payload = response as {
        lines?: unknown;
        logs?: unknown;
        entries?: unknown;
        data?: unknown;
      };
      const candidate = payload.lines ?? payload.logs ?? payload.entries ?? payload.data;
      if (Array.isArray(candidate)) {
        return candidate.map((line) => String(line));
      }
      if (typeof candidate === 'string') {
        return candidate.split('\n').filter((line) => line.trim().length > 0);
      }
    }
    return [];
  }
}
