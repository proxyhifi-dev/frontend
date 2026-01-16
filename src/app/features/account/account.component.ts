import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AccountProfile, LiveAccountService } from '../../core/services/live-account.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { AccountOverviewDTO, PaperAccountDTO } from '../../core/models/account.dto';
import { HoldingDTO } from '../../core/models/holding.dto';
import { TradingMode } from '../../core/services/trading-mode.service';
import { PaperService } from '../../core/paper/paper.service';

interface HoldingRow {
  symbol: string;
  quantity: number;
  avgPrice?: number;
  pnl?: number;
  value?: number;
  raw?: HoldingDTO;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
  profile?: AccountProfile;
  overview?: AccountOverviewDTO;
  paperAccount?: PaperAccountDTO;
  holdings: HoldingRow[] = [];
  broker = { status: 'DISCONNECTED', clientId: '-', broker: '-' };
  isLiveMode = false;
  loading = false;
  modeLoading = false;
  holdingsError = '';
  modeSupported = true;

  private sub = new Subscription();

  constructor(
    private liveAccountService: LiveAccountService,
    private paperService: PaperService,
    private fyersService: FyersOAuthService,
    private notificationService: NotificationService,
    private modeStore: ModeStore
  ) {}

  ngOnInit() {
    this.sub.add(
      this.modeStore.mode$.subscribe((mode) => {
        this.isLiveMode = mode === 'LIVE';
        this.loadAccountData();
      })
    );
    this.sub.add(
      this.modeStore.modeSupported$.subscribe((supported) => {
        this.modeSupported = supported;
      })
    );
    this.loadMode();
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  get totalEquity(): number {
    if (this.isLiveMode) {
      return Number(
        this.overview?.['totalEquity'] ??
        this.overview?.['equity'] ??
        this.overview?.['total'] ??
        0
      );
    }
    return Number(
      this.paperAccount?.equity ??
      this.paperAccount?.totalEquity ??
      this.paperAccount?.balance ??
      0
    );
  }

  get usedEquity(): number {
    if (this.isLiveMode) {
      return Number(this.overview?.['used'] ?? this.overview?.['utilized'] ?? 0);
    }
    return Number(this.paperAccount?.used ?? 0);
  }

  get freeEquity(): number {
    if (this.isLiveMode) {
      return Number(
        this.overview?.['free'] ??
        this.overview?.['available'] ??
        Math.max(this.totalEquity - this.usedEquity, 0)
      );
    }
    return Number(this.paperAccount?.free ?? Math.max(this.totalEquity - this.usedEquity, 0));
  }

  toggleMode(): void {
    if (!this.modeSupported) {
      this.notificationService.warning('Backend mode endpoint pending.', 'Mode Locked');
      return;
    }
    const nextMode: TradingMode = this.isLiveMode ? 'PAPER' : 'LIVE';
    this.modeLoading = true;
    this.sub.add(
      this.modeStore.setMode(nextMode).pipe(
        finalize(() => {
          this.modeLoading = false;
        })
      ).subscribe({
        next: () => {
          this.isLiveMode = nextMode === 'LIVE';
          this.loadAccountData();
        },
        error: () => {
          this.notificationService.error('Failed to update trading mode.');
        }
      })
    );
  }

  handleDeposit(): void {
    const amount = this.promptAmount('Enter deposit amount');
    if (amount === null) {
      return;
    }
    this.loading = true;
    this.sub.add(
      this.paperService.deposit(amount).pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: () => {
          this.notificationService.success('Deposit successful.');
          this.loadAccountData();
        },
        error: () => {
          this.notificationService.error('Failed to deposit funds.');
        }
      })
    );
  }

  handleWithdraw(): void {
    const amount = this.promptAmount('Enter withdrawal amount');
    if (amount === null) {
      return;
    }
    this.loading = true;
    this.sub.add(
      this.paperService.withdraw(amount).pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: () => {
          this.notificationService.success('Withdrawal successful.');
          this.loadAccountData();
        },
        error: () => {
          this.notificationService.error('Failed to withdraw funds.');
        }
      })
    );
  }

  handleReset(): void {
    if (!confirm('Reset paper account balance and positions?')) {
      return;
    }
    this.loading = true;
    this.sub.add(
      this.paperService.reset().pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: () => {
          this.notificationService.success('Paper account reset.');
          this.loadAccountData();
        },
        error: () => {
          this.notificationService.error('Failed to reset paper account.');
        }
      })
    );
  }

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

  private loadMode(): void {
    this.modeLoading = true;
    this.sub.add(
      this.modeStore.syncFromBackend().pipe(
        finalize(() => {
          this.modeLoading = false;
        })
      ).subscribe({
        next: () => {
          return;
        },
        error: () => {
          this.notificationService.error('Failed to load trading mode.');
        }
      })
    );
  }

  private loadAccountData(): void {
    this.loading = true;
    this.holdingsError = '';
    if (this.isLiveMode) {
      this.sub.add(
        forkJoin({
          overview: this.liveAccountService.getOverview(),
          profile: this.liveAccountService.getProfile(),
          holdings: this.liveAccountService.getHoldings()
        }).pipe(
          finalize(() => {
            this.loading = false;
          })
        ).subscribe({
          next: ({ overview, profile, holdings }) => {
            this.overview = overview;
            this.profile = profile;
            this.holdings = this.normalizeHoldings(holdings || []);
            const isConnected = typeof profile?.['connected'] === 'boolean' ? profile['connected'] : false;
            const status = typeof profile?.['status'] === 'string' ? profile['status'] : undefined;
            const clientId = typeof profile?.['clientId'] === 'string' ? profile['clientId'] : '-';
            const broker = typeof profile?.['broker'] === 'string' ? profile['broker'] : '-';
            this.broker = {
              status: isConnected || status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
              clientId,
              broker
            };
          },
          error: () => {
            this.notificationService.error('Failed to load live account data.');
            this.holdingsError = 'Unable to load holdings.';
          }
        })
      );
      return;
    }

    this.sub.add(
      this.paperService.getAccount().pipe(
        finalize(() => {
          this.loading = false;
        })
      ).subscribe({
        next: (account) => {
          this.paperAccount = account;
          this.overview = undefined;
          this.profile = undefined;
          this.holdings = [];
          this.holdingsError = '';
        },
        error: () => {
          this.notificationService.error('Failed to load paper account data.');
        }
      })
    );
  }

  private promptAmount(message: string): number | null {
    const raw = prompt(message);
    if (raw === null) {
      return null;
    }
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      this.notificationService.error('Amount must be greater than 0.');
      return null;
    }
    return amount;
  }

  private normalizeHoldings(holdings: HoldingDTO[]): HoldingRow[] {
    return holdings.map((holding) => ({
      symbol: holding?.symbol ?? holding?.tradingSymbol ?? holding?.ticker ?? holding?.instrument ?? '-',
      quantity: Number(holding?.qty ?? holding?.quantity ?? holding?.netQty ?? 0),
      avgPrice: this.numberOrUndefined(holding?.avgPrice ?? holding?.averagePrice ?? holding?.buyAvg),
      pnl: this.numberOrUndefined(holding?.pnl ?? holding?.profitLoss ?? holding?.unrealizedPnl),
      value: this.numberOrUndefined(holding?.value ?? holding?.marketValue ?? holding?.currentValue),
      raw: holding
    }));
  }

  private numberOrUndefined(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }
}
