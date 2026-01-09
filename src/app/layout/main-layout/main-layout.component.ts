import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subject, takeUntil } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { SidebarComponent } from '../sidebar/sidebar.component'; // Ensure this file exists
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';
import { SignalService } from '../../core/services/signal.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent, MobileNavComponent, CommandPaletteComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  unreadCount = 3;
  searchQuery = '';
  pageTitle = 'Dashboard';
  breadcrumb = 'Home / Dashboard';
  dataSource = 'Paper Ledger';
  isConnected = true;
  lastUpdated?: Date;
  private lastMode?: boolean;
  private destroy$ = new Subject<void>();
  private readonly routeTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    account: 'Account',
    positions: 'Positions',
    holdings: 'Holdings',
    orders: 'Orders',
    trades: 'Trades',
    backtesting: 'Backtesting',
    signals: 'Signals',
    strategy: 'Strategy / Bot',
    risk: 'Risk',
    logs: 'Logs',
    settings: 'Settings',
    help: 'Help',
    analytics: 'Analytics'
  };

  constructor(
    public store: StoreService,
    private router: Router,
    private signalService: SignalService,
    private dashboardService: DashboardService,
    private fyersOAuthService: FyersOAuthService
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
        if (this.lastMode !== state.isLiveMode) {
          this.lastMode = state.isLiveMode;
          this.dashboardService.toggleMode(state.isLiveMode).subscribe();
          this.signalService.setMode(!state.isLiveMode).subscribe();
          this.dataSource = state.isLiveMode ? 'Fyers' : 'Paper Ledger';
          this.refreshConnectionStatus(state.isLiveMode);
        }
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
