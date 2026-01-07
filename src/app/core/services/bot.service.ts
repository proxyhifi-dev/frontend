import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
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
  private botStatusSubject = new Subject<BotStatus>();
  public botStatus$ = this.botStatusSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/strategy`;

  constructor(private http: HttpClient) {}

  getBotStatus(): Observable<BotStatus> {
    return this.botStatus$;
  }

  setBotStatus(isActive: boolean): Observable<any> {
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  triggerManualScan(): Observable<any> {
    return this.http.post(`${this.apiUrl}/scan-now`, {});
  }

  // Alias for triggerManualScan to match component usage
  scanNow(): Observable<any> {
    return this.triggerManualScan();
  }
}
