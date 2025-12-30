import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Signal } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class SignalService {
  private apiUrl = '/api/strategy';

  constructor(private http: HttpClient) {}

  getLatestSignals(): Observable<Signal[]> {
    return this.http.get<Signal[]>(`${this.apiUrl}/signals`);
  }

  approveSignal(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/approve/${id}`, {});
  }

  rejectSignal(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reject/${id}`, {});
  }
}
