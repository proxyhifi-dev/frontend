import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountOverviewDTO } from '../models/account.dto';
import { HoldingDTO } from '../models/holding.dto';

export interface AccountProfile {
  name?: string;
  email?: string;
  clientId?: string;
  broker?: string;
  status?: string;
  connected?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class LiveAccountService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<AccountOverviewDTO> {
    return this.http.get<AccountOverviewDTO>(`${this.apiUrl}/account/overview`);
  }

  getProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${this.apiUrl}/account/profile`);
  }

  getHoldings(): Observable<HoldingDTO[]> {
    return this.http.get<HoldingDTO[]>(`${this.apiUrl}/account/holdings`);
  }
}
