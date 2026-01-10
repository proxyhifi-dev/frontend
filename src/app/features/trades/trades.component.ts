import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { PositionService } from '../../core/services/position.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { StoreService } from '../../core/services/store.service';
import { RMultiplePipe } from '../../shared/pipes/r-multiple.pipe';

@Component({
  selector: 'app-trades',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, RMultiplePipe],
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.scss']
})
export class TradesComponent implements OnInit, OnDestroy {
  tradeHistory: any[] = [];
  filteredTrades: any[] = [];
  isLoading = false;
  errorMessage = '';
  filters = {
    symbol: '',
    grade: 'All',
    mode: 'All',
    startDate: '',
    endDate: ''
  };
  private lastMode?: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private positionSvc: PositionService,
    private store: StoreService
  ) {}

  ngOnInit() {
    this.loadHistory();
    this.store.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (this.lastMode !== state.isLiveMode) {
          this.lastMode = state.isLiveMode;
          this.loadHistory();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory() {
    this.isLoading = true;
    this.errorMessage = '';
    this.positionSvc.getClosedPositions().pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (data) => {
        this.tradeHistory = data;
        this.applyFilters();
      },
      error: () => {
        this.errorMessage = 'Unable to load trade history.';
        this.filteredTrades = [];
      }
    });
  }

  applyFilters() {
    const symbol = this.filters.symbol.trim().toLowerCase();
    const grade = this.filters.grade;
    const mode = this.filters.mode;
    const start = this.filters.startDate ? new Date(this.filters.startDate) : null;
    const end = this.filters.endDate ? new Date(this.filters.endDate) : null;

    this.filteredTrades = this.tradeHistory.filter(trade => {
      const matchesSymbol = !symbol || trade.symbol?.toLowerCase().includes(symbol);
      const matchesGrade = grade === 'All' || trade.grade === grade;
      const matchesMode = mode === 'All' || (mode === 'Paper' && trade.isPaperTrade) || (mode === 'Live' && !trade.isPaperTrade);
      const tradeDate = trade.exitTime ? new Date(trade.exitTime) : null;
      const matchesStart = !start || (tradeDate && tradeDate >= start);
      const matchesEnd = !end || (tradeDate && tradeDate <= end);
      return matchesSymbol && matchesGrade && matchesMode && matchesStart && matchesEnd;
    });
  }

  resetFilters() {
    this.filters = {
      symbol: '',
      grade: 'All',
      mode: 'All',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }

  getExitClass(reason: string): string {
    switch(reason) {
      case 'TARGET': return 'badge-target';
      case 'STOP_LOSS': return 'badge-sl';
      case 'TIME_EXIT': return 'badge-time';
      default: return 'badge-neutral';
    }
  }
}
