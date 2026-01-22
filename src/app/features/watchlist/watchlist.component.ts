import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { WatchlistService } from '../../core/services/watchlist.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss']
})
export class WatchlistComponent implements OnInit {
  symbols: string[] = [];
  symbolInput = '';
  bulkInput = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private watchlistService: WatchlistService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadWatchlist();
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
    this.watchlistService
      .getWatchlist()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (symbols) => {
          this.symbols = symbols ?? [];
        },
        error: () => {
          this.errorMessage = 'Unable to load watchlist.';
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
    this.watchlistService.removeSymbol(symbol).subscribe({
      next: () => {
        this.symbols = this.symbols.filter((item) => item !== symbol);
      },
      error: () => {
        this.notificationService.error('Watchlist', 'Unable to remove symbol.');
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
    this.watchlistService.addSymbols(incomingSymbols).subscribe({
      next: (response) => {
        this.symbols = response?.length ? response : merged;
        this.notificationService.success('Watchlist', 'Symbols added.');
      },
      error: () => {
        this.notificationService.error('Watchlist', 'Unable to add symbols.');
      }
    });
  }
}
