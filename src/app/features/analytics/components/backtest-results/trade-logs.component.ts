import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BacktestDetail } from '../../../../core/services/backtest.service';

interface TradeLogEntry {
  date?: string;
  entryPrice?: number;
  exitPrice?: number;
  points?: number;
  win?: boolean;
}

@Component({
  selector: 'app-trade-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-logs.component.html'
})
export class TradeLogsComponent {
  @Input() results: BacktestDetail | null = null;

  get tradeLogs(): TradeLogEntry[] {
    return (this.results?.trades ?? []) as TradeLogEntry[];
  }
}
