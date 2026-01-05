import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User } from '../models/auth.model';

// Define the expected structure of the API response
interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  // Use HttpClient directly to avoid circular dependencies with ApiService/Interceptors
  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('apex_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // ✅ Fix: Add the missing 'token' property required by AuthGuard
  public get token(): string | null {
    // Assuming the token is stored in the User object or you can store it separately in localStorage
    return this.currentUserValue?.token || localStorage.getItem('apex_token') || null;
  }

  login(password: string) {
    // ✅ Fix: Strictly type the response to LoginResponse
    return this.http.post<LoginResponse>('/api/auth/login', { password }).pipe(
      map(res => {
        // ✅ Fix: TypeScript now knows 'res' has 'user' and 'token'
        if (res && res.user) {
          // If the token comes separately, merge it or store it
          if (res.token) {
            res.user.token = res.token; // Ensure User model has token field, or store separately
            localStorage.setItem('apex_token', res.token);
          }

          localStorage.setItem('apex_user', JSON.stringify(res.user));
          this.currentUserSubject.next(res.user);
        }
        return res;
      })
    );
  }

  logout() {
    localStorage.removeItem('apex_user');
    localStorage.removeItem('apex_token');
    this.currentUserSubject.next(null);
  }
}

// Additional methods for Fyers OAuth (append to existing auth.service.ts)
getFyersAuthUrl(): Observable<{ authUrl: string }> {
  return this.http.get<{ authUrl: string }>(`${this.apiUrl}/auth/fyers/auth-url`);
}

handleFyersCallback(authCode: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/fyers/callback`, { authCode });
}

register(email: string, username: string, password: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/register`, { email, username, password });
}
