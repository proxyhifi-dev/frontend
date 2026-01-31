import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, map, catchError, timeout } from 'rxjs';
import { AuthResponse, User } from '../models/auth.model';
import { TokenService } from '../auth/token.service';
import { HttpBaseService } from '../http/http-base.service';
import { WebSocketService } from '../websocket/websocket.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpBaseService,
    private router: Router,
    private tokenService: TokenService,
    private websocketService: WebSocketService,
    private runtimeConfig: RuntimeConfigService
  ) {
    const user = sessionStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenService.getAccessToken();
  }

  get refreshToken(): string | null {
    return this.tokenService.getRefreshToken();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap((response) => this.persistAuth(response))
    );
  }

  register(email: string, username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/register', { email, username, password }).pipe(
      tap((response) => this.persistAuth(response))
    );
  }

  bootstrapSession(): Observable<User | null> {
    if (!this.isAuthenticated()) {
      return of(null);
    }

    if (!this.runtimeConfig.hasEndpoint('/auth/me')) {
      const storedUser = this.currentUserSubject.value;
      const token = this.tokenService.getAccessToken();
      if (token) {
        this.websocketService.connect(token);
      }
      return of(storedUser);
    }

    return this.http.get<User>('/auth/me').pipe(
      tap((user) => {
        this.setUser(user);
        const token = this.tokenService.getAccessToken();
        if (token) {
          this.websocketService.connect(token);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    if (this.tokenService.getAccessToken()) {
      this.http.post<void>('/auth/logout', {}).pipe(catchError(() => of(undefined))).subscribe();
    }
    this.tokenService.clear();
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.websocketService.disconnect();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  getToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  updateAuthState(user: User | null, token: string, refreshToken?: string): void {
    if (token) {
      this.tokenService.setAccessToken(token);
      this.websocketService.connect(token);
    }
    if (refreshToken) {
      this.tokenService.setRefreshToken(refreshToken);
    }
    if (user) {
      this.setUser(user);
    }
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken || !this.runtimeConfig.hasEndpoint('POST', '/auth/refresh')) {
      return of('');
    }
    return this.http.post<{ accessToken?: string; token?: string }>('/auth/refresh', { refreshToken }).pipe(
      map((response) => response.accessToken || response.token || ''),
      tap((token) => {
        if (token) {
          this.tokenService.setAccessToken(token);
        }
      })
    );
  }

  getFyersAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>('/auth/fyers/auth-url').pipe(timeout(6000));
  }

  loginWithFyers(): Observable<void> {
    return this.getFyersAuthUrl().pipe(
      tap((response) => {
        if (!response?.authUrl) {
          throw new Error('Fyers auth URL missing');
        }
        window.location.href = response.authUrl;
      }),
      map(() => undefined)
    );
  }

  handleFyersCallback(authCode: string, state?: string): Observable<AuthResponse> {
    const payload: { auth_code: string; state?: string } = { auth_code: authCode };
    if (state) {
      payload.state = state;
    }
    return this.http.post<AuthResponse>('/auth/fyers/callback', payload).pipe(
      tap((response) => this.persistAuth(response))
    );
  }

  private persistAuth(response: AuthResponse): void {
    const accessToken = response.accessToken || response.token;
    if (accessToken) {
      this.tokenService.setAccessToken(accessToken);
      this.websocketService.connect(accessToken);
    }
    if (response.refreshToken) {
      this.tokenService.setRefreshToken(response.refreshToken);
    }
    if (response.user) {
      this.setUser(response.user);
    }
  }

  private setUser(user: User): void {
    sessionStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
