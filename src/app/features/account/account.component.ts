import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StoreService } from '../../core/services/store.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { Subscription, switchMap } from 'rxjs';

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

  private sub = new Subscription();

  constructor(private http: HttpClient, private store: StoreService) {}

  ngOnInit() {
    this.sub.add(
      this.store.state$.pipe(
        switchMap(() => {
          const mode = this.store.snapshot.isLiveMode ? 'LIVE' : 'PAPER';
          return this.http.get<any>(`/api/account/summary?type=${mode}`);
        })
      ).subscribe(res => {
        if (res) {
          this.profile = { name: res.name || 'Trader', email: res.email || 'user@apex.bot' };
          this.capital = {
            total: res.totalEquity || 0,
            used: res.usedMargin || 0,
            free: (res.totalEquity - res.usedMargin) || 0
          };
          this.broker = { status: res.brokerStatus || 'CONNECTED' };
        }
      })
    );
  }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
