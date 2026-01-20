import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
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
export interface UiEndpointDTO {
  method?: string;
  path: string;
  description?: string;
}

export interface UiConfig {
  apiBaseUrl: string;
  wsUrl: string;
  wsBaseUrl?: string;
  wsTopics?: string[];

  /**
   * UI previously assumed endpoints were strings.
   * Backend returns objects -> allow both.
   */
  endpoints?: Array<string | UiEndpointDTO> | Record<string, string | string[]>;

  /**
   * UI uses entities[] with entityFields[]
   * Backend may send entityFields map instead.
   */
  entities?: UiEntityConfig[];
  entityFields?: Record<string, Array<UiEntityField | string>>;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private configSubject = new BehaviorSubject<UiConfig | null>(null);
  readonly config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {}

  load(): Observable<UiConfig> {
    // NOTE: keeping your current request style
    return this.http.get<UiConfig>(`${environment.apiBaseUrl}/ui/config`).pipe(
      tap((config) => this.configSubject.next(this.normalizeConfig(config))),
      catchError(() => {
        const fallback = this.createFallback();
        this.configSubject.next(fallback);
        this.toastService.showWarning('Using default API configuration.');
        return of(fallback);
      })
    );
  }

  get apiBaseUrl(): string {
    return this.configSubject.value?.apiBaseUrl ?? environment.apiBaseUrl;
  }

  get wsUrl(): string {
    return this.configSubject.value?.wsUrl ?? environment.wsUrl;
  }

  get endpoints(): string[] {
    return this.normalizeEndpoints(this.configSubject.value?.endpoints);
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

  hasEndpoint(path: string): boolean {
    const normalized = this.normalizeEndpoint(path);
    return this.endpoints.some((endpoint) => this.normalizeEndpoint(endpoint) === normalized);
  }

  // ------------------------
  // Normalization
  // ------------------------

  private normalizeConfig(config: UiConfig): UiConfig {
    const wsUrl = config.wsUrl || config.wsBaseUrl || environment.wsUrl;

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
      apiBaseUrl: config.apiBaseUrl || environment.apiBaseUrl,
      wsUrl,
      wsBaseUrl: config.wsBaseUrl,
      wsTopics: config.wsTopics ?? [],
      endpoints: this.normalizeEndpoints(config.endpoints),
      entities: mergedEntities,
      entityFields: config.entityFields
    };
  }

  private createFallback(): UiConfig {
    return {
      apiBaseUrl: environment.apiBaseUrl,
      wsUrl: environment.wsUrl,
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

  private normalizeEndpoints(endpoints?: UiConfig['endpoints']): string[] {
    if (!endpoints) return [];

    // Case 1: Record<string, string|string[]>
    if (!Array.isArray(endpoints) && typeof endpoints === 'object') {
      const collected: string[] = [];
      Object.values(endpoints).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((entry) => collected.push(this.normalizeEndpoint(entry)));
        } else if (typeof value === 'string') {
          collected.push(this.normalizeEndpoint(value));
        }
      });
      return collected;
    }

    // Case 2: Array<string | UiEndpointDTO>
    if (Array.isArray(endpoints)) {
      return endpoints
        .map((e) => {
          if (!e) return '';

          if (typeof e === 'string') return e;

          // UiEndpointDTO from backend
          const dto = e as UiEndpointDTO;
          return typeof dto.path === 'string' ? dto.path : '';
        })
        .filter(Boolean)
        .map((p) => this.normalizeEndpoint(p));
    }

    return [];
  }
}
