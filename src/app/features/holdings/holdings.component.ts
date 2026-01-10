import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { LiveAccountService } from '../../core/services/live-account.service';
import { TradingModeService } from '../../core/services/trading-mode.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';

@Component({
  selector: 'app-holdings',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './holdings.component.html',
  styleUrls: ['./holdings.component.scss']
})
export class HoldingsComponent implements OnInit {
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

  constructor(
    private liveAccountService: LiveAccountService,
    private tradingModeService: TradingModeService
  ) {}

  ngOnInit(): void {
    this.loadModeAndHoldings();
  }

  loadModeAndHoldings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.tradingModeService.getMode().pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (mode) => {
        this.isLiveMode = mode === 'LIVE';
        if (this.isLiveMode) {
          this.loadHoldings();
        } else {
          this.holdings = [];
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load trading mode.';
      }
    });
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

  private normalizeHoldings(holdings: any[]) {
    return holdings.map((holding) => ({
      symbol: holding?.symbol ?? holding?.tradingSymbol ?? holding?.ticker ?? holding?.instrument ?? '—',
      quantity: Number(holding?.qty ?? holding?.quantity ?? holding?.netQty ?? 0),
      avgPrice: this.numberOrUndefined(holding?.avgPrice ?? holding?.averagePrice ?? holding?.buyAvg),
      currentPrice: this.numberOrUndefined(holding?.ltp ?? holding?.lastPrice ?? holding?.currentPrice),
      pnl: this.numberOrUndefined(holding?.pnl ?? holding?.profitLoss ?? holding?.unrealizedPnl),
      pnlPercent: this.numberOrUndefined(holding?.pnlPercent ?? holding?.profitLossPercent ?? holding?.unrealizedPnlPercent)
    }));
  }

  private numberOrUndefined(value: any): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  }
}
