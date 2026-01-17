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

export interface UiConfig {
  apiBaseUrl: string;
  wsUrl: string;
  wsBaseUrl?: string;
  wsTopics?: string[];
  endpoints?: string[] | Record<string, string | string[]>;
  entities?: UiEntityConfig[];
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private configSubject = new BehaviorSubject<UiConfig | null>(null);
  readonly config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {}

  load(): Observable<UiConfig> {
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
    return this.configSubject.value?.entities ?? [];
  }

  get wsTopics(): string[] {
    return this.configSubject.value?.wsTopics ?? [];
  }

  getEntityFields(entityType: string): UiEntityField[] {
    const normalizedType = entityType.toLowerCase();
    const entity = this.entities.find((entry) => entry.name.toLowerCase() === normalizedType);
    return entity?.entityFields ?? [];
  }

  hasEndpoint(path: string): boolean {
    const normalized = this.normalizeEndpoint(path);
    return this.endpoints.some((endpoint) => this.normalizeEndpoint(endpoint) === normalized);
  }

  private normalizeConfig(config: UiConfig): UiConfig {
    const wsUrl = config.wsUrl || config.wsBaseUrl || environment.wsUrl;
    return {
      apiBaseUrl: config.apiBaseUrl || environment.apiBaseUrl,
      wsUrl,
      wsBaseUrl: config.wsBaseUrl,
      wsTopics: config.wsTopics ?? [],
      endpoints: this.normalizeEndpoints(config.endpoints),
      entities: config.entities ?? []
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
    if (!path) {
      return '';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        return this.normalizeEndpoint(new URL(path).pathname);
      } catch {
        return path;
      }
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized.startsWith('/api/') ? normalized.replace('/api', '') : normalized;
  }

  private normalizeEndpoints(endpoints?: UiConfig['endpoints']): string[] {
    if (!endpoints) {
      return [];
    }
    if (Array.isArray(endpoints)) {
      return endpoints.map((endpoint) => this.normalizeEndpoint(endpoint));
    }
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
}
