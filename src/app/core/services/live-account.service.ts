import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AccountOverview {
  totalEquity?: number;
  used?: number;
  free?: number;
  [key: string]: any;
}

export interface AccountProfile {
  name?: string;
  email?: string;
  clientId?: string;
  broker?: string;
  status?: string;
  connected?: boolean;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class LiveAccountService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<AccountOverview> {
    return this.http.get<AccountOverview>(`${this.apiUrl}/account/overview`);
  }

  getProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>(`${this.apiUrl}/account/profile`);
  }

  getHoldings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/account/holdings`);
  }
}
