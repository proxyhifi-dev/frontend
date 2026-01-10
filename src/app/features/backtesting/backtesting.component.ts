import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  BacktestDetail,
  BacktestMetrics,
  BacktestMonthlyBreakdown,
  BacktestRun,
  BacktestService
} from '../../core/services/backtest.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { RMultiplePipe } from '../../shared/pipes/r-multiple.pipe';

@Component({
  selector: 'app-backtesting',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe, PercentFormatPipe, RMultiplePipe],
  templateUrl: './backtesting.component.html',
  styleUrls: ['./backtesting.component.scss']
})
export class BacktestingComponent implements OnInit {
  runs: BacktestRun[] = [];
  selectedRun?: BacktestRun;
  metrics?: BacktestMetrics;
  monthly: BacktestMonthlyBreakdown[] = [];
  runsLoading = false;
  runsError = '';
  detailLoading = false;
  detailError = '';
  runSubmitting = false;

  form = {
    strategy: '',
    universe: '',
    interval: '15m',
    startDate: '',
    endDate: '',
    capital: 100000
  };

  constructor(
    private backtestService: BacktestService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  loadRuns(): void {
    this.runsLoading = true;
    this.runsError = '';
    this.backtestService.getRuns().pipe(
      finalize(() => (this.runsLoading = false))
    ).subscribe({
      next: (runs) => {
        this.runs = runs || [];
      },
      error: () => {
        this.runsError = 'Unable to load backtest runs.';
        this.runs = [];
      }
    });
  }

  runBacktest(): void {
    if (this.runSubmitting) {
      return;
    }
    this.runSubmitting = true;
    this.backtestService.runBacktest({ ...this.form }).pipe(
      finalize(() => (this.runSubmitting = false))
    ).subscribe({
      next: (run) => {
        this.notify.success('Backtest Started', 'Your backtest is running.');
        this.loadRuns();
        if (run?.id) {
          this.selectRun(run);
        }
      },
      error: () => {
        this.notify.error('Backtest Failed', 'Unable to start backtest.');
      }
    });
  }

  selectRun(run: BacktestRun): void {
    this.selectedRun = run;
    this.metrics = undefined;
    this.monthly = [];
    this.detailLoading = true;
    this.detailError = '';
    this.backtestService.getRunDetail(run.id).pipe(
      finalize(() => (this.detailLoading = false))
    ).subscribe({
      next: (detail: BacktestDetail) => {
        this.metrics = detail.metrics;
        this.monthly = detail.monthly ?? [];
      },
      error: () => {
        this.detailError = 'Unable to load run details.';
      }
    });
  }
}
