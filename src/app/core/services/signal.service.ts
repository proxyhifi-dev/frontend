import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Signal, SignalDetail } from '../models/domain.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalService {
  private apiUrl = `${environment.apiUrl}/strategy`;

  constructor(private http: HttpClient) {}

  getSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>(`${this.apiUrl}/signals`);
  }

  getPendingSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>(`${this.apiUrl}/signals/pending`);
  }

  getSignalDetail(signalId: number): Observable<SignalDetail> {
    return this.http.get<SignalDetail>(`${this.apiUrl}/signals/${signalId}`);
  }

  scanNow(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/scan-now`, {});
  }

  getMode(): Observable<{ mode: 'PAPER' | 'LIVE' }> {
    return this.http.get<{ mode: 'PAPER' | 'LIVE' }>(`${this.apiUrl}/mode`);
  }

  setMode(mode: 'PAPER' | 'LIVE'): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mode?mode=${mode}`, {});
  }

  executeSignal(signalId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/execute`, { signalId });
  }
}
