import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

export type ScannerUniverseType = 'WATCHLIST' | 'SYMBOLS';

export interface ScannerRunRequest {
  universe: {
    type: ScannerUniverseType;
    symbols?: string[];
  };
  strategy?: string;
}

export interface ScannerRunResponse {
  runId: string;
  status?: string;
}

export interface ScannerRunStatus {
  runId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  progress?: {
    totalSymbols?: number;
    processedSymbols?: number;
  };
  diagnostics?: {
    rejected?: Record<string, number>;
    totalSymbols?: number;
  };
}

export interface ScannerResultRow {
  id?: number;
  symbol: string;
  score?: number;
  grade?: string;
  scanTime?: string;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class ScannerService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  isSupported(): boolean {
    return this.runtimeConfig.hasEndpoint('POST', '/scanner/run') || this.runtimeConfig.hasEndpoint('/scanner/run');
  }

  buildRunRequest(universeType: ScannerUniverseType, symbols: string[], strategy?: string): ScannerRunRequest {
    return {
      universe: {
        type: universeType,
        symbols: universeType === 'SYMBOLS' ? symbols : undefined
      },
      strategy
    };
  }

  runScan(request: ScannerRunRequest): Observable<ScannerRunResponse> {
    return this.http.post<ScannerRunResponse>('/scanner/run', request);
  }

  getRunStatus(runId: string): Observable<ScannerRunStatus> {
    return this.http.get<ScannerRunStatus>(`/scanner/runs/${encodeURIComponent(runId)}`);
  }

  getRunResults(runId: string): Observable<ScannerResultRow[]> {
    return this.http.get<ScannerResultRow[]>(`/scanner/runs/${encodeURIComponent(runId)}/results`);
  }

  cancelRun(runId: string): Observable<void> {
    return this.http.post<void>(`/scanner/runs/${encodeURIComponent(runId)}/cancel`, {});
  }
}
