import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FyersOAuthService {
  private apiUrl = `${environment.apiUrl}/auth/fyers`;

  constructor(private http: HttpClient) {}

  getAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>(`${this.apiUrl}/auth-url`);
  }

  handleCallback(authCode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/callback`, { authCode });
  }

  disconnectFyers(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/disconnect`, {});
  }

  getFyersStatus(): Observable<{ connected: boolean }> {
    return this.http.get<{ connected: boolean }>(`${this.apiUrl}/status`);
  }
}
