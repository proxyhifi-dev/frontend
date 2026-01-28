import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ScannerRunRequest, ScannerRunResponse, ScannerRunStatus } from './scanner.service';
import { WatchlistResponse } from './watchlist.service';
import { RuntimeConfigResponse } from '../config/runtime-config.service';
import { AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpBaseService) {}

  getUiConfig(): Observable<RuntimeConfigResponse> {
    return this.http.get<RuntimeConfigResponse>('/ui/config');
  }

  getWatchlist(): Observable<WatchlistResponse | string[]> {
    return this.http.get<WatchlistResponse | string[]>('/watchlist');
  }

  addSymbol(symbols: string | string[]): Observable<WatchlistResponse | string[]> {
    const payload = Array.isArray(symbols) ? symbols : [symbols];
    return this.http.post<WatchlistResponse | string[]>('/watchlist/items', { symbols: payload });
  }

  removeSymbol(symbol: string): Observable<void> {
    return this.http.delete<void>(`/watchlist/items/${encodeURIComponent(symbol)}`);
  }

  seedWatchlist(count = 100): Observable<WatchlistResponse | string[]> {
    return this.http.get<WatchlistResponse | string[]>(`/dev/seed-watchlist?count=${count}`);
  }

  runScan(request: ScannerRunRequest): Observable<ScannerRunResponse> {
    return this.http.post<ScannerRunResponse>('/scanner/run', request);
  }

  getScanRun(runId: string): Observable<ScannerRunStatus> {
    return this.http.get<ScannerRunStatus>(`/scanner/runs/${encodeURIComponent(runId)}`);
  }

  fyersAuthUrl(): Observable<{ authUrl: string }> {
    return this.http.get<{ authUrl: string }>('/auth/fyers/auth-url');
  }

  devLogin(username: string, password?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/dev/login', { username, password });
  }
}
