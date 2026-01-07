import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Signal } from '../models/domain.model';
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

  scanNow(): Observable<any> {
    return this.http.post(`${this.apiUrl}/scan-now`, {});
  }

  getMode(): Observable<{ paperMode: boolean }> {
    return this.http.get<{ paperMode: boolean }>(`${this.apiUrl}/mode`);
  }

  setMode(paperMode: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/mode?paperMode=${paperMode}`, {});
  }
}
