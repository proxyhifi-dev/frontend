import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subject, takeUntil } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { SidebarComponent } from '../sidebar/sidebar.component'; // Ensure this file exists
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { TradingStoreService } from '../../core/services/trading-store.service';
import { SafetyStatusService } from '../../core/services/safety-status.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, MobileNavComponent, CommandPaletteComponent, CurrencyInrPipe],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  searchQuery = '';
  pageTitle = 'Dashboard';
  breadcrumb = 'Home / Dashboard';
  dataSource = 'Paper Ledger';
  isConnected = false;
  lastUpdated?: Date;
  modeSupported = true;
  panicConfirmOpen = false;
  panicInput = '';
  panicError = '';
  panicSubmitting = false;
  private lastMode?: string;
  private destroy$ = new Subject<void>();
  private readonly routeTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    account: 'Paper Account',
    positions: 'Positions',
    holdings: 'Holdings',
    orders: 'Orders',
    trades: 'Trades',
    backtesting: 'Backtesting',
    signals: 'Signals',
    strategy: 'Strategy / Bot',
    risk: 'Risk',
    'risk-correlation': 'Risk & Correlation',
    logs: 'Logs',
    settings: 'Settings',
    analytics: 'Analytics'
  };

  constructor(
    public store: StoreService,
    private router: Router,
    private fyersOAuthService: FyersOAuthService,
    public modeStore: ModeStore,
    public tradingStore: TradingStoreService,
    public safetyStatus: SafetyStatusService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePageMeta(this.router.url);
      });

    this.updatePageMeta(this.router.url);

    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.searchQuery = state.searchSymbol ?? '';
      });

    this.modeStore.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        if (this.lastMode !== mode) {
          this.lastMode = mode;
          this.dataSource = mode === 'LIVE' ? 'Fyers' : 'Paper Ledger';
          this.refreshConnectionStatus(mode === 'LIVE');
        }
      });

    this.modeStore.modeSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.modeSupported = supported;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitSearch(): void {
    const term = this.searchQuery.trim();
    this.store.setSearchSymbol(term);

    if (term) {
      this.router.navigate(['/signals']);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.store.setSearchSymbol('');
  }

  handleConnectionClick(): void {
    if (!this.isConnected) {
      this.router.navigate(['/settings']);
    }
  }

  toggleMode(): void {
    if (!this.modeSupported) {
      return;
    }
    const nextMode = this.modeStore.snapshot === 'LIVE' ? 'PAPER' : 'LIVE';
    this.modeStore.setMode(nextMode).subscribe();
  }

  openPanicConfirm(): void {
    this.panicConfirmOpen = true;
    this.panicInput = '';
    this.panicError = '';
  }

  closePanicConfirm(): void {
    if (this.panicSubmitting) {
      return;
    }
    this.panicConfirmOpen = false;
    this.panicInput = '';
    this.panicError = '';
  }

  confirmPanic(): void {
    if (this.panicSubmitting) {
      return;
    }
    if (this.panicInput.trim().toUpperCase() !== 'PANIC') {
      this.panicError = 'You must type PANIC to confirm the global kill switch.';
      return;
    }
    this.panicError = '';
    this.panicSubmitting = true;
    this.safetyStatus.triggerGlobalPanic().subscribe({
      next: () => {
        this.panicSubmitting = false;
        this.panicConfirmOpen = false;
        this.panicInput = '';
      },
      error: (err: unknown) => {
        const message = (err as { userMessage?: string })?.userMessage ?? 'Unable to trigger global panic.';
        this.panicError = message;
        this.panicSubmitting = false;
      }
    });
  }

  private updatePageMeta(url: string): void {
    const segment = url.split('?')[0].split('/').filter(Boolean)[0] ?? 'dashboard';
    const title = this.routeTitles[segment] || 'Dashboard';
    this.pageTitle = title;
    this.breadcrumb = `Home / ${title}`;
  }

  private refreshConnectionStatus(isLiveMode: boolean): void {
    if (!isLiveMode) {
      this.isConnected = true;
      this.lastUpdated = new Date();
      return;
    }

    this.fyersOAuthService.getFyersStatus().subscribe({
      next: ({ connected }) => {
        this.isConnected = connected;
        this.lastUpdated = new Date();
      },
      error: () => {
        this.isConnected = false;
        this.lastUpdated = new Date();
      }
    });
  }
}
