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
  endpoints?: string[];
  entities?: UiEntityConfig[];
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private configSubject = new BehaviorSubject<UiConfig | null>(null);
  readonly config$ = this.configSubject.asObservable();

  constructor(private http: HttpClient, private toastService: ToastService) {}

  load(): Observable<UiConfig> {
    return this.http.get<UiConfig>(`${environment.apiUrl}/ui/config`).pipe(
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
    return this.configSubject.value?.apiBaseUrl ?? environment.apiUrl;
  }

  get wsUrl(): string {
    return this.configSubject.value?.wsUrl ?? environment.wsUrl;
  }

  get endpoints(): string[] {
    return this.configSubject.value?.endpoints ?? [];
  }

  get entities(): UiEntityConfig[] {
    return this.configSubject.value?.entities ?? [];
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
    return {
      apiBaseUrl: config.apiBaseUrl || environment.apiUrl,
      wsUrl: config.wsUrl || environment.wsUrl,
      endpoints: config.endpoints ?? [],
      entities: config.entities ?? []
    };
  }

  private createFallback(): UiConfig {
    return {
      apiBaseUrl: environment.apiUrl,
      wsUrl: environment.wsUrl,
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
        return new URL(path).pathname;
      } catch {
        return path;
      }
    }
    return path.startsWith('/') ? path : `/${path}`;
  }
}
