import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BacktestDetail } from '../../../../core/services/backtest.service';

@Component({
  selector: 'app-trade-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-logs.component.html'
})
export class TradeLogsComponent {
  @Input() results: BacktestDetail | null = null;
}
