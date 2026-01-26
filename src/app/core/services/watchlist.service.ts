import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface WatchlistResponse {
  symbols?: string[];
  items?: WatchlistItem[] | string[];
}

export interface WatchlistItem {
  symbol: string;
  addedAt?: string;
}

export interface WatchlistValidationResult {
  symbols: string[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  static readonly MAX_SYMBOLS = 100;
  private static readonly SYMBOL_PATTERN = /^[A-Z0-9._-]+$/;

  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  isSupported(): boolean {
    return this.runtimeConfig.hasEndpoint('GET', '/watchlist') || this.runtimeConfig.hasEndpoint('/watchlist');
  }

  getWatchlist(): Observable<string[]> {
    return this.http.get<string[] | WatchlistResponse>('/watchlist').pipe(
      map((response) => this.extractSymbols(response))
    );
  }

  addSymbols(symbols: string[]): Observable<string[]> {
    return this.http.post<string[] | WatchlistResponse>('/watchlist/items', { symbols }).pipe(
      map((response) => this.extractSymbols(response))
    );
  }

  replaceWatchlist(symbols: string[]): Observable<string[]> {
    return this.http.put<string[] | WatchlistResponse>('/watchlist', { symbols }).pipe(
      map((response) => this.extractSymbols(response))
    );
  }

  removeSymbol(symbol: string): Observable<void> {
    return this.http.delete<void>(`/watchlist/items/${encodeURIComponent(symbol)}`);
  }

  validateSymbols(input: string[] | string): WatchlistValidationResult {
    const rawSymbols = Array.isArray(input)
      ? input
      : input.split(/[\s,]+/).map((symbol) => symbol.trim());

    const normalized = rawSymbols.filter(Boolean).map((symbol) => symbol.toUpperCase());
    const unique = Array.from(new Set(normalized));
    const errors: string[] = [];

    const invalidSymbols = unique.filter((symbol) => !WatchlistService.SYMBOL_PATTERN.test(symbol));
    if (invalidSymbols.length) {
      errors.push(`Invalid symbols: ${invalidSymbols.join(', ')}`);
    }

    if (unique.length > WatchlistService.MAX_SYMBOLS) {
      errors.push(`Watchlist supports up to ${WatchlistService.MAX_SYMBOLS} symbols.`);
    }

    return { symbols: unique, errors };
  }

  private extractSymbols(response: string[] | WatchlistResponse): string[] {
    if (!response) {
      return [];
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (Array.isArray(response.symbols)) {
      return response.symbols;
    }
    const items = Array.isArray(response.items) ? response.items : [];
    if (items.length && typeof items[0] === 'string') {
      return items as string[];
    }
    return (items as WatchlistItem[]).map((item) => item.symbol).filter(Boolean);
  }
}
