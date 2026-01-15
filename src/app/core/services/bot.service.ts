import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { ApiError } from '../models/api-error.model';

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
  private controlSupportedSubject = new BehaviorSubject<boolean>(false);
  readonly controlSupported$ = this.controlSupportedSubject.asObservable();

  constructor(private http: HttpBaseService) {}

  getBotStatus(): Observable<BotStatus> {
    return this.fetchStatus();
  }

  setBotStatus(isActive: boolean): Observable<BotActionResponse> {
    if (!this.controlSupportedSubject.value) {
      return of({ success: false, message: 'Backend bot control endpoint pending' });
    }
    return this.http.post<BotActionResponse>('/bot/status', { isActive }).pipe(
      catchError((error: ApiError) => {
        if (error.status === 404) {
          this.controlSupportedSubject.next(false);
        }
        return of({ success: false, message: error.userMessage });
      })
    );
  }

  triggerManualScan(): Observable<BotActionResponse> {
    return this.http.post<BotActionResponse>('/strategy/scan-now', {}).pipe(
      catchError((error: ApiError) => of({ success: false, message: error.userMessage }))
    );
  }

  scanNow(): Observable<BotActionResponse> {
    return this.triggerManualScan();
  }

  fetchStatus(): Observable<BotStatus> {
    return this.http.get<BotStatus>('/bot/status').pipe(
      map((status) => ({
        ...status,
        nextScanTime: status?.nextScanTime ? new Date(status.nextScanTime) : new Date(),
        lastScanTime: status?.lastScanTime ? new Date(status.lastScanTime) : new Date()
      }))
    );
  }
}
