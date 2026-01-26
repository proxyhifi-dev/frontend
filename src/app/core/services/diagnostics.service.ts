import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface DiagnosticsResponse {
  [key: string]: unknown;
}

export type DiagnosticsSeverity = 'error' | 'warning' | 'success';

export interface DiagnosticsStatusItem {
  label: string;
  severity: DiagnosticsSeverity;
}

@Injectable({ providedIn: 'root' })
export class DiagnosticsService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  isSupported(): boolean {
    return (
      this.runtimeConfig.hasEndpoint('GET', '/diagnostics') ||
      this.runtimeConfig.hasEndpoint('/diagnostics')
    );
  }

  getDiagnostics(): Observable<DiagnosticsResponse | null> {
    if (!this.isSupported()) {
      return of(null);
    }
    return this.http.get<DiagnosticsResponse>('/diagnostics');
  }

  buildStatusItems(diagnostics: DiagnosticsResponse | null): DiagnosticsStatusItem[] {
    if (!diagnostics) {
      return [];
    }

    const items: DiagnosticsStatusItem[] = [];

    const scannerDisabled = this.readBoolean(diagnostics, [
      'scannerDisabled',
      'scanner.disabled',
      'scanner.isDisabled'
    ]);
    const scannerEnabled =
      this.readBoolean(diagnostics, ['scannerEnabled', 'scanner.enabled', 'scanner.active']) ??
      (scannerDisabled !== undefined ? !scannerDisabled : undefined);

    if (scannerEnabled === false) {
      items.push({ label: 'Scanner disabled', severity: 'error' });
    }

    const watchlistCount = this.readCount(diagnostics, [
      'watchlistCount',
      'watchlist.count',
      'watchlist.total',
      'watchlist.size',
      'watchlist.symbols',
      'watchlistSymbols'
    ]);

    if (watchlistCount === 0) {
      items.push({ label: 'No watchlist stocks', severity: 'error' });
    }

    const scannerStatus = this.readString(diagnostics, [
      'scannerStatus',
      'scanner.status',
      'scanner.state',
      'scanner.runStatus'
    ]);

    if (scannerStatus && scannerStatus.toUpperCase() === 'PENDING') {
      items.push({ label: 'Scanner stuck in PENDING', severity: 'warning' });
    }

    const botThreadAlive = this.readBoolean(diagnostics, [
      'botThreadAlive',
      'bot.threadAlive',
      'bot.thread_alive',
      'bot.alive'
    ]);

    if (botThreadAlive === false) {
      items.push({ label: 'Bot thread dead', severity: 'error' });
    }

    const fyersConfigured = this.readBoolean(diagnostics, [
      'fyersConfigured',
      'fyers.configured',
      'broker.fyersConfigured',
      'fyers.enabled'
    ]);

    if (fyersConfigured === false) {
      items.push({ label: 'FYERS not configured', severity: 'error' });
    }

    if (items.length === 0) {
      items.push({ label: 'System healthy', severity: 'success' });
    }

    return items;
  }

  buildIssueSummary(diagnostics: DiagnosticsResponse | null): DiagnosticsStatusItem[] {
    return this.buildStatusItems(diagnostics).filter((item) => item.severity !== 'success');
  }

  isScannerDisabled(diagnostics: DiagnosticsResponse | null): boolean {
    const items = this.buildStatusItems(diagnostics);
    return items.some((item) => item.label === 'Scanner disabled');
  }

  private readBoolean(diagnostics: DiagnosticsResponse, paths: string[]): boolean | undefined {
    for (const path of paths) {
      const value = this.readValue(diagnostics, path);
      if (value === undefined || value === null) {
        continue;
      }
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        if (['true', 'yes', 'enabled'].includes(value.toLowerCase())) {
          return true;
        }
        if (['false', 'no', 'disabled'].includes(value.toLowerCase())) {
          return false;
        }
      }
    }
    return undefined;
  }

  private readString(diagnostics: DiagnosticsResponse, paths: string[]): string | undefined {
    for (const path of paths) {
      const value = this.readValue(diagnostics, path);
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
    return undefined;
  }

  private readCount(diagnostics: DiagnosticsResponse, paths: string[]): number | undefined {
    for (const path of paths) {
      const value = this.readValue(diagnostics, path);
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        return value.length;
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
      if (typeof value === 'object' && value && 'length' in value) {
        const maybeLength = (value as { length?: number }).length;
        if (typeof maybeLength === 'number') {
          return maybeLength;
        }
      }
    }
    return undefined;
  }

  private readValue(diagnostics: DiagnosticsResponse, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = diagnostics;
    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }
}
