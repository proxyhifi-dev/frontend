import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

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

  constructor() {}

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
    return new Observable(observer => {
      observer.next({ scannedCount: 0 });
      observer.complete();
    });
  }
}
