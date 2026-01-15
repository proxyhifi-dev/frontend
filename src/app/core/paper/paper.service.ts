import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { PaperAccountDTO } from '../models/account.dto';

@Injectable({ providedIn: 'root' })
export class PaperService {
  constructor(private http: HttpBaseService) {}

  getAccount(): Observable<PaperAccountDTO> {
    return this.http.get<PaperAccountDTO>('/paper/account');
  }

  deposit(amount: number): Observable<void> {
    return this.http.post<void>('/paper/account/deposit', { amount });
  }

  withdraw(amount: number): Observable<void> {
    return this.http.post<void>('/paper/account/withdraw', { amount });
  }

  reset(payload: { amount?: number } = {}): Observable<void> {
    return this.http.post<void>('/paper/account/reset', payload);
  }
}
