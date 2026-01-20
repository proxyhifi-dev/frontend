import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { PaperAccountDTO } from '../models/account.dto';
import { TokenService } from '../auth/token.service';

@Injectable({ providedIn: 'root' })
export class PaperService {
  constructor(
    private http: HttpBaseService,
    private tokenService: TokenService
  ) {}

  /**
   * ✅ Don't hit backend if user is not authenticated.
   * Prevents noisy 401/403 on initial app load.
   *
   * If you prefer: return throwError(() => new Error('Not authenticated'))
   * instead of a safe empty object.
   */
  getAccount(): Observable<PaperAccountDTO> {
    if (!this.hasToken()) {
      // Return a safe placeholder so UI can render without blowing up
      return of(this.emptyAccount());
    }
    return this.http.get<PaperAccountDTO>('/paper/account');
  }

  deposit(amount: number): Observable<void> {
    if (!this.hasToken()) return throwError(() => new Error('Not authenticated'));
    return this.http.post<void>('/paper/account/deposit', { amount });
  }

  withdraw(amount: number): Observable<void> {
    if (!this.hasToken()) return throwError(() => new Error('Not authenticated'));
    return this.http.post<void>('/paper/account/withdraw', { amount });
  }

  reset(payload: { amount?: number } = {}): Observable<void> {
    if (!this.hasToken()) return throwError(() => new Error('Not authenticated'));
    return this.http.post<void>('/paper/account/reset', payload);
  }

  private hasToken(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  private emptyAccount(): PaperAccountDTO {
    // Keep this minimal & safe; adjust fields if your DTO has different names
    return {
      balance: 0,
      equity: 0,
      availableCash: 0,
      currency: 'INR'
    } as unknown as PaperAccountDTO;
  }
}
