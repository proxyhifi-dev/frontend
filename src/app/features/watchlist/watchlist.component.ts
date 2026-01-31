import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, timer } from 'rxjs';
import { WatchlistService } from '../../core/services/watchlist.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiClientService } from '../../core/services/api-client.service';
import { HttpErrorResponse } from '@angular/common/http';
import { mapHttpError } from '../../core/utils/api-error';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit, OnDestroy {
  symbols: string[] = [];
  symbolInput = '';
  bulkInput = '';
  isLoading = false;
  errorMessage = '';
  pendingItems: string[] = [];
  pendingStatus = '';
  readonly emptyStates = EMPTY_STATE_MESSAGES;

  private pendingRefreshSub?: Subscription;

  constructor(
    private watchlistService: WatchlistService,
    private toastService: ToastService,
    private apiClient: ApiClientService
  ) {}

  ngOnInit(): void {
    this.loadWatchlist();
  }

  ngOnDestroy(): void {
    this.pendingRefreshSub?.unsubscribe();
  }

  get usedCount(): number {
    return this.symbols.length;
  }

  get maxCount(): number {
    return WatchlistService.MAX_SYMBOLS;
  }

  loadWatchlist(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.apiClient
      .getWatchlist()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          const { symbols, pending } = this.normalizeWatchlist(response);
          this.symbols = symbols;
          this.pendingItems = pending;
          this.pendingStatus = pending.length ? `Pending watchlist items: ${pending.length}` : '';
          this.handlePendingRefresh();
        },
        error: () => {
          this.errorMessage = 'Unable to load watchlist.';
          this.toastService.showError(this.errorMessage);
        }
      });
  }

  addSymbol(): void {
    const { symbols, errors } = this.watchlistService.validateSymbols(this.symbolInput);
    if (errors.length) {
      this.errorMessage = errors.join(' ');
      return;
    }
    this.updateWatchlist(symbols);
    this.symbolInput = '';
  }

  addBulk(): void {
    const { symbols, errors } = this.watchlistService.validateSymbols(this.bulkInput);
    if (errors.length) {
      this.errorMessage = errors.join(' ');
      return;
    }
    this.updateWatchlist(symbols);
    this.bulkInput = '';
  }

  removeSymbol(symbol: string): void {
    this.apiClient.removeSymbol(symbol).subscribe({
      next: () => {
        this.symbols = this.symbols.filter((item) => item !== symbol);
      },
      error: (err: unknown) => {
        const message = this.buildErrorMessage(err, 'Unable to remove symbol.');
        this.errorMessage = message;
        this.toastService.showError(message);
      }
    });
  }

  private updateWatchlist(incomingSymbols: string[]): void {
    this.errorMessage = '';
    const merged = Array.from(new Set([...this.symbols, ...incomingSymbols]));
    if (merged.length > this.maxCount) {
      this.errorMessage = `Watchlist supports up to ${this.maxCount} symbols.`;
      return;
    }
    this.apiClient.addSymbol(incomingSymbols).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.symbols = response.length ? response : merged;
        } else {
          this.symbols = response?.symbols?.length ? response.symbols : merged;
        }
        this.toastService.showSuccess('Watchlist: Symbols added.');
      },
      error: (err: unknown) => {
        const message = this.buildErrorMessage(err, 'Unable to add symbols.');
        this.errorMessage = message;
        this.toastService.showError(message);
      }
    });
  }

  refreshWatchlist(): void {
    this.loadWatchlist();
  }

  private normalizeWatchlist(response: unknown): { symbols: string[]; pending: string[] } {
    if (!response) {
      return { symbols: [], pending: [] };
    }
    if (Array.isArray(response)) {
      return { symbols: response, pending: [] };
    }
    const payload = response as {
      symbols?: string[];
      items?: Array<{ symbol?: string } | string>;
      pending?: string[];
      pendingItems?: Array<{ symbol?: string } | string>;
      pendingSymbols?: string[];
    };

    const symbols =
      payload.symbols ??
      (Array.isArray(payload.items)
        ? payload.items.map((item) => (typeof item === 'string' ? item : item.symbol || '')).filter(Boolean)
        : []);

    const pending =
      payload.pendingSymbols ??
      payload.pending ??
      (Array.isArray(payload.pendingItems)
        ? payload.pendingItems
            .map((item) => (typeof item === 'string' ? item : item.symbol || ''))
            .filter(Boolean)
        : []);

    return { symbols, pending };
  }

  private handlePendingRefresh(): void {
    if (this.pendingItems.length === 0) {
      this.pendingRefreshSub?.unsubscribe();
      this.pendingRefreshSub = undefined;
      return;
    }
    if (this.pendingRefreshSub) {
      return;
    }
    this.pendingRefreshSub = timer(5000, 5000).subscribe(() => {
      this.loadWatchlist();
    });
  }

  private buildErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = mapHttpError(error);
      const status = error.status ? ` (HTTP ${error.status})` : '';
      return `${apiError.userMessage}${status}`;
    }
    return fallback;
  }
}
