import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subject, takeUntil } from 'rxjs';
import { LiveAccountService } from '../../core/services/live-account.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { ModeStore } from '../../core/services/mode-store.service';
import { HoldingDTO } from '../../core/models/holding.dto';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

@Component({
  selector: 'app-holdings',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.scss']
})
export class HoldingsComponent implements OnInit, OnDestroy {
  holdings: Array<{
    symbol: string;
    quantity: number;
    avgPrice?: number;
    currentPrice?: number;
    pnl?: number;
    pnlPercent?: number;
  }> = [];
  isLoading = false;
  errorMessage = '';
  isLiveMode = false;
  readonly emptyStates = EMPTY_STATE_MESSAGES;
  private destroy$ = new Subject<void>();

  constructor(
    private liveAccountService: LiveAccountService,
    private modeStore: ModeStore
  ) {}

  ngOnInit(): void {
    this.modeStore.mode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.isLiveMode = mode === 'LIVE';
        if (this.isLiveMode) {
          this.loadHoldings();
        } else {
          this.holdings = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHoldings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.liveAccountService.getHoldings().pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (holdings) => {
        this.holdings = this.normalizeHoldings(holdings ?? []);
      },
      error: () => {
        this.errorMessage = 'Unable to load holdings.';
        this.holdings = [];
      }
    });
  }

  private normalizeHoldings(holdings: HoldingDTO[]) {
    return holdings.map((holding) => ({
      symbol: holding?.symbol ?? holding?.tradingSymbol ?? holding?.ticker ?? holding?.instrument ?? '—',
      quantity: Number(holding?.qty ?? holding?.quantity ?? holding?.netQty ?? 0),
      avgPrice: this.numberOrUndefined(holding?.avgPrice ?? holding?.averagePrice ?? holding?.buyAvg),
      currentPrice: this.numberOrUndefined(holding?.ltp ?? holding?.lastPrice ?? holding?.currentPrice),
      pnl: this.numberOrUndefined(holding?.pnl ?? holding?.profitLoss ?? holding?.unrealizedPnl),
      pnlPercent: this.numberOrUndefined(holding?.pnlPercent ?? holding?.profitLossPercent ?? holding?.unrealizedPnlPercent)
    }));
  }

  private numberOrUndefined(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }
}
