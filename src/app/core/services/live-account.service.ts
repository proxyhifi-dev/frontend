import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AccountOverviewDTO } from '../models/account.dto';
import { HoldingDTO } from '../models/holding.dto';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface AccountProfile {
  name?: string;
  email?: string;
  broker?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class LiveAccountService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  getOverview(): Observable<AccountOverviewDTO> {
    return this.optionalGet<AccountOverviewDTO>('/account/overview', {});
  }

  getProfile(): Observable<AccountProfile> {
    return this.optionalGet<AccountProfile>('/account/profile', {});
  }

  getHoldings(): Observable<HoldingDTO[]> {
    return this.optionalGet<HoldingDTO[]>('/account/holdings', []);
  }

  private optionalGet<T>(path: string, fallback: T): Observable<T> {
    if (!this.runtimeConfig.hasEndpoint(path)) {
      return of(fallback);
    }
    return this.http.get<T>(path);
  }
}
