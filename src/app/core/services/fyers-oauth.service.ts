import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BrokerConnectionStatus, BrokerErrorLog } from '../models/broker.dto';

@Injectable({
  providedIn: 'root'
})
export class FyersOAuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/auth/fyers/auth-url`);
  }

  handleCallback(authCode: string): Observable<BrokerConnectionStatus> {
    return this.http.post<BrokerConnectionStatus>(`${this.apiUrl}/auth/fyers/callback`, { auth_code: authCode });
  }

  disconnectFyers(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/fyers/disconnect`, {});
  }

  getFyersStatus(): Observable<BrokerConnectionStatus> {
    return this.http.get<BrokerConnectionStatus>(`${this.apiUrl}/auth/fyers/status`);
  }

  getFyersErrors(): Observable<BrokerErrorLog[]> {
    return this.http.get<BrokerErrorLog[]>(`${this.apiUrl}/auth/fyers/errors`);
  }
}
