import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessTokenKey = 'token';
  private readonly refreshTokenKey = 'refreshToken';

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setAccessToken(token: string): void {
    if (token) {
      localStorage.setItem(this.accessTokenKey, token);
    }
  }

  setRefreshToken(token: string): void {
    if (token) {
      localStorage.setItem(this.refreshTokenKey, token);
    }
  }

  setTokens(accessToken?: string | null, refreshToken?: string | null): void {
    if (accessToken) {
      this.setAccessToken(accessToken);
    }
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  clear(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }
}
