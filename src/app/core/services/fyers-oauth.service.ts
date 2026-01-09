import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FyersOAuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/auth/fyers/auth-url`);
  }

  handleCallback(authCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/fyers/callback`, { auth_code: authCode });
  }

  disconnectFyers(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/fyers/disconnect`, {});
  }

  getFyersStatus(): Observable<{ connected: boolean }> {
    return this.http.get<{ connected: boolean }>(`${this.apiUrl}/auth/fyers/status`);
  }
}
