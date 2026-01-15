import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountOverviewDTO } from '../models/account.dto';
import { HoldingDTO } from '../models/holding.dto';
import { HttpBaseService } from '../http/http-base.service';

export interface AccountProfile {
  name?: string;
  email?: string;
  broker?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class LiveAccountService {
  constructor(private http: HttpBaseService) {}

  getOverview(): Observable<AccountOverviewDTO> {
    return this.http.get<AccountOverviewDTO>('/account/overview');
  }

  getProfile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>('/account/profile');
  }

  getHoldings(): Observable<HoldingDTO[]> {
    return this.http.get<HoldingDTO[]>('/account/holdings');
  }
}
