import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class BotService {
  private apiUrl = `${environment.apiUrl}/bot`;

  constructor(private http: HttpClient) {}

  getBotStatus(): Observable<BotStatus> {
    return this.fetchStatus();
  }

  setBotStatus(isActive: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/status`, { isActive }).pipe(
      catchError(() => of({ success: false }))
    );
  }

  triggerManualScan(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/strategy/scan-now`, {});
  }

  // Alias for triggerManualScan to match component usage
  scanNow(): Observable<any> {
    return this.triggerManualScan();
  }

  fetchStatus(): Observable<BotStatus> {
    return this.http.get<BotStatus>(`${this.apiUrl}/status`).pipe(
      catchError(() => of<BotStatus>({
        isActive: false,
        status: 'Stopped',
        nextScanTime: new Date(),
        scannedStocks: 0,
        totalStocks: 0,
        lastScanTime: new Date(),
        currentStrategy: 'Unknown'
      }))
    );
  }
}
