import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BotStatus {
  isActive: boolean;
  status: 'Running' | 'Paused' | 'Stopped';
  nextScanTime: Date;
  scannedStocks: number;
  totalStocks: number;
  lastScanTime: Date;
  currentStrategy: string;
}

export interface BotActionResponse {
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BotService {
  private apiUrl = `${environment.apiUrl}/bot`;

  constructor(private http: HttpClient) {}

  getBotStatus(): Observable<BotStatus> {
    return this.fetchStatus();
  }

  setBotStatus(isActive: boolean): Observable<BotActionResponse> {
    return this.http.post<BotActionResponse>(`${this.apiUrl}/status`, { isActive }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  triggerManualScan(): Observable<BotActionResponse> {
    return this.http.post<BotActionResponse>(`${environment.apiUrl}/strategy/scan-now`, {});
  }

  // Alias for triggerManualScan to match component usage
  scanNow(): Observable<BotActionResponse> {
    return this.triggerManualScan();
  }

  fetchStatus(): Observable<BotStatus> {
    return this.http.get<BotStatus>(`${this.apiUrl}/status`).pipe(
      map((status) => ({
        ...status,
        nextScanTime: status?.nextScanTime ? new Date(status.nextScanTime) : new Date(),
        lastScanTime: status?.lastScanTime ? new Date(status.lastScanTime) : new Date()
      }))
    );
  }
}
