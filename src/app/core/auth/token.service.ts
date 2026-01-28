import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessTokenKey = 'token';
  private readonly refreshTokenKey = 'refreshToken';
  private accessTokenMemory: string | null = null;
  private refreshTokenMemory: string | null = null;

  getAccessToken(): string | null {
    if (this.accessTokenMemory) {
      return this.accessTokenMemory;
    }
    const stored = localStorage.getItem(this.accessTokenKey) ?? sessionStorage.getItem(this.accessTokenKey);
    this.accessTokenMemory = stored;
    return stored;
  }

  getRefreshToken(): string | null {
    if (this.refreshTokenMemory) {
      return this.refreshTokenMemory;
    }
    const stored = localStorage.getItem(this.refreshTokenKey) ?? sessionStorage.getItem(this.refreshTokenKey);
    this.refreshTokenMemory = stored;
    return stored;
  }

  setAccessToken(token: string): void {
    if (token) {
      this.accessTokenMemory = token;
      localStorage.setItem(this.accessTokenKey, token);
      sessionStorage.setItem(this.accessTokenKey, token);
    }
  }

  setRefreshToken(token: string): void {
    if (token) {
      this.refreshTokenMemory = token;
      localStorage.setItem(this.refreshTokenKey, token);
      sessionStorage.setItem(this.refreshTokenKey, token);
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
    this.accessTokenMemory = null;
    this.refreshTokenMemory = null;
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
  }
}
