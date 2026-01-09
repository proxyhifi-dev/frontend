import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '../../core/services/store.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { Subscription, forkJoin, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  // Properties required by template
  profile = { name: 'Trader', email: 'user@apex.bot' };
  capital = { total: 0, used: 0, free: 0 };
  broker = { status: 'DISCONNECTED' };
  isLiveMode = false;

  private sub = new Subscription();
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private store: StoreService,
    private fyersService: FyersOAuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.sub.add(
      this.store.state$.pipe(
        switchMap(() => {
          this.isLiveMode = this.store.snapshot.isLiveMode;
          return forkJoin({
            profile: this.http.get<any>(`${this.apiUrl}/account/profile`),
            capital: this.http.get<any>(`${this.apiUrl}/account/capital`),
            summary: this.http.get<any>(`${this.apiUrl}/account/summary`)
          });
        })
      ).subscribe(({ profile, capital, summary }) => {
        if (profile) {
          this.profile = { name: profile.name || 'Trader', email: profile.email || 'user@apex.bot' };
          this.broker = { status: profile.fyersConnected ? 'CONNECTED' : 'DISCONNECTED' };
        }
        if (capital) {
          this.capital = {
            total: capital.total || 0,
            used: capital.used || 0,
            free: capital.free || Math.max((capital.total || 0) - (capital.used || 0), 0)
          };
        }
        if (summary) {
          const total = summary.currentValue ?? summary.availableFunds ?? 0;
          const used = summary.totalInvested ?? 0;
          this.capital = {
            total,
            used,
            free: Math.max(total - used, 0)
          };
        }
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  connectFyers(): void {
    this.fyersService.getAuthUrl().subscribe({
      next: (response) => {
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        } else {
          this.notificationService.error('Fyers auth URL is missing. Check backend configuration.');
        }
      },
      error: () => this.notificationService.error('Failed to initiate Fyers connection.')
    });
  }
}
