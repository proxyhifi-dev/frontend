import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaperAccount {
  balance?: number;
  free?: number;
  used?: number;
  equity?: number;
  totalEquity?: number;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class PaperAccountService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAccount(): Observable<PaperAccount> {
    return this.http.get<PaperAccount>(`${this.apiUrl}/paper/account`);
  }

  deposit(amount: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/paper/account/deposit`, { amount });
  }

  withdraw(amount: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/paper/account/withdraw`, { amount });
  }

  reset(payload: Record<string, unknown> = {}): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/paper/account/reset`, payload);
  }
}
