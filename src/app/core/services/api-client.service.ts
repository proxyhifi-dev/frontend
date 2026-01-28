import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ScannerRunRequest, ScannerRunResponse, ScannerRunStatus } from './scanner.service';
import { WatchlistResponse } from './watchlist.service';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  constructor(private http: HttpBaseService) {}

  getWatchlist(): Observable<WatchlistResponse | string[]> {
    return this.http.get<WatchlistResponse | string[]>('/watchlist');
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
}
