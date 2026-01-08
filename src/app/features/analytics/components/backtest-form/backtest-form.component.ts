import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BacktestParams {
  symbol: string;
  interval: string;
  from: string;
  to: string;
  useSqueeze: boolean;
  useVwap: boolean;
}

@Component({
  selector: 'app-backtest-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backtest-form.component.html'
})
export class BacktestFormComponent {
  @Output() run = new EventEmitter<BacktestParams>();

  params: BacktestParams = {
    symbol: '',
    interval: '5m',
    from: '',
    to: '',
    useSqueeze: true,
    useVwap: false
  };

  loading = false;

  runBacktest() {
    if (this.loading) return;
    this.loading = true;
    this.run.emit(this.params);
    setTimeout(() => {
      this.loading = false;
    }, 300);
  }
}
