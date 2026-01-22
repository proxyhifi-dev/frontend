import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { ToastService } from '../services/toast.service';

export interface UiEntityField {
  name: string;
  label?: string;
  type?: string;
}

export interface UiEntityConfig {
  name: string;
  entityFields: UiEntityField[];
}

/**
 * Backend may return endpoints as objects:
 * { method: "GET", path: "/api/strategy/mode", description: "..." }
 */
export interface RuntimeEndpoint {
  method: string;
  path: string;
  description?: string;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  wsBaseUrl?: string;
  wsTopics?: string[];
  endpoints: RuntimeEndpoint[];
  entities?: UiEntityConfig[];
  entityFields?: Record<string, Array<UiEntityField | string>>;
}

export interface RuntimeConfigResponse {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  wsUrl?: string;
  wsTopics?: string[];
  endpoints?: Array<string | RuntimeEndpoint> | Record<string, string | string[]>;
  entities?: UiEntityConfig[];
  entityFields?: Record<string, Array<UiEntityField | string>>;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private configSubject = new BehaviorSubject<RuntimeConfig>(this.createFallback());
  private configLoadedSubject = new BehaviorSubject<boolean>(false);
  private configUnavailableSubject = new BehaviorSubject<boolean>(false);
  readonly config$ = this.configSubject.asObservable();
  readonly configLoaded$ = this.configLoadedSubject.asObservable();
  readonly configUnavailable$ = this.configUnavailableSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {}

  load(): Observable<RuntimeConfig> {
    return this.http.get<RuntimeConfigResponse>('/api/ui/config').pipe(
      map((config) => {
        const normalized = this.normalizeConfig(config);
        this.configSubject.next(normalized);
        this.configLoadedSubject.next(true);
        this.configUnavailableSubject.next(false);
        return normalized;
      }),
      catchError(() => {
        const fallback = this.createFallback();
        this.configSubject.next(fallback);
        this.configLoadedSubject.next(true);
        this.configUnavailableSubject.next(true);
        this.toastService.showWarning('Backend config unavailable. Running in limited mode.');
        return of(fallback);
      })
    );
  }

  getApiBaseUrl(): string {
    return this.normalizeBaseUrl(this.configSubject.value.apiBaseUrl);
  }

  getWsBaseUrl(): string {
    return this.normalizeBaseUrl(this.configSubject.value.wsBaseUrl ?? '');
  }

  listEndpoints(): RuntimeEndpoint[] {
    return [...this.configSubject.value.endpoints];
  }

  isConfigAvailable(): boolean {
    return !this.configUnavailableSubject.value;
  }

  isConfigLoaded(): boolean {
    return this.configLoadedSubject.value;
  }

  get endpoints(): RuntimeEndpoint[] {
    return this.configSubject.value.endpoints;
  }

  get entities(): UiEntityConfig[] {
    // after normalizeConfig(), entities will be populated even if backend only sends entityFields map
    return this.configSubject.value?.entities ?? [];
  }

  get wsTopics(): string[] {
    return this.configSubject.value?.wsTopics ?? [];
  }

  getEntityFields(entityType: string): UiEntityField[] {
    const normalizedType = (entityType || '').toLowerCase();
    const entity = this.entities.find((entry) => entry.name.toLowerCase() === normalizedType);
    return entity?.entityFields ?? [];
  }

  hasEndpoint(path: string): boolean;
  hasEndpoint(method: string, path: string): boolean;
  hasEndpoint(methodOrPath: string, path?: string): boolean {
    const method = path ? methodOrPath : undefined;
    const targetPath = path ?? methodOrPath;
    const normalizedPath = this.normalizeEndpoint(targetPath);
    const normalizedMethod = method?.toUpperCase();

    return this.endpoints.some((endpoint) => {
      const endpointPath = this.normalizeEndpoint(endpoint.path);
      if (endpointPath !== normalizedPath) {
        return false;
      }
      if (!normalizedMethod || endpoint.method === 'ANY') {
        return true;
      }
      return endpoint.method === normalizedMethod;
    });
  }

  // ------------------------
  // Normalization
  // ------------------------

  private normalizeConfig(config: RuntimeConfigResponse): RuntimeConfig {
    const wsBaseUrl = config.wsBaseUrl || config.wsUrl || '/ws';

    // ✅ Convert backend entityFields map -> entities[] (if entities[] not provided)
    const entitiesFromMap: UiEntityConfig[] =
      config.entityFields && typeof config.entityFields === 'object'
        ? Object.entries(config.entityFields).map(([name, fields]) => ({
            name,
            entityFields: (Array.isArray(fields) ? fields : []).map((f) =>
              typeof f === 'string' ? ({ name: f } as UiEntityField) : (f as UiEntityField)
            )
          }))
        : [];

    const mergedEntities =
      (config.entities && config.entities.length ? config.entities : entitiesFromMap) ?? [];

    return {
      apiBaseUrl: config.apiBaseUrl || '/api',
      wsBaseUrl,
      wsTopics: config.wsTopics ?? [],
      endpoints: this.normalizeEndpoints(config.endpoints),
      entities: mergedEntities,
      entityFields: config.entityFields
    };
  }

  private createFallback(): RuntimeConfig {
    return {
      apiBaseUrl: '/api',
      wsBaseUrl: '/ws',
      wsTopics: [],
      endpoints: [],
      entities: []
    };
  }

  private normalizeEndpoint(path: string): string {
    if (!path) return '';

    // If full URL, normalize by pathname
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        return this.normalizeEndpoint(new URL(path).pathname);
      } catch {
        return path;
      }
    }

    // Ensure leading slash
    const normalized = path.startsWith('/') ? path : `/${path}`;

    /**
     * Your UI removes "/api" prefix so it can compare with UI paths.
     * Keep your existing behavior.
     */
    return normalized.startsWith('/api/') ? normalized.replace('/api', '') : normalized;
  }

  private normalizeEndpoints(endpoints?: RuntimeConfigResponse['endpoints']): RuntimeEndpoint[] {
    if (!endpoints) return [];

    // Case 1: Record<string, string|string[]>
    if (!Array.isArray(endpoints) && typeof endpoints === 'object') {
      const collected: RuntimeEndpoint[] = [];
      Object.entries(endpoints).forEach(([method, value]) => {
        const normalizedMethod = method.toUpperCase();
        if (Array.isArray(value)) {
          value.forEach((entry) =>
            collected.push({ method: normalizedMethod, path: this.normalizeEndpoint(entry) })
          );
        } else if (typeof value === 'string') {
          collected.push({ method: normalizedMethod, path: this.normalizeEndpoint(value) });
        }
      });
      return collected;
    }

    // Case 2: Array<string | RuntimeEndpoint>
    if (Array.isArray(endpoints)) {
      return endpoints
        .map((e) => {
          if (!e) return null;

          if (typeof e === 'string') {
            return { method: 'ANY', path: this.normalizeEndpoint(e) } as RuntimeEndpoint;
          }

          const dto = e as RuntimeEndpoint;
          const method = dto.method ? dto.method.toUpperCase() : 'ANY';
          return dto.path ? { ...dto, method, path: this.normalizeEndpoint(dto.path) } : null;
        })
        .filter(Boolean) as RuntimeEndpoint[];
    }

    return [];
  }

  private normalizeBaseUrl(baseUrl: string): string {
    if (!baseUrl) return '';
    return baseUrl.replace(/\/+$/, '');
  }
}
