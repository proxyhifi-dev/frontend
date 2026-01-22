import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil, timer } from 'rxjs';
import {
  ScannerResultRow,
  ScannerRunStatus,
  ScannerService,
  ScannerUniverseType
} from '../../core/services/scanner.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { StrategyService } from '../../core/services/strategy.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.scss']
})
export class ScannerComponent implements OnInit, OnDestroy {
  universe: ScannerUniverseType = 'WATCHLIST';
  manualSymbols = '';
  strategy = '';
  strategyOptions: string[] = [];
  runStatus?: ScannerRunStatus;
  results: ScannerResultRow[] = [];
  diagnostics: Record<string, number> = {};
  totalSymbols = 0;
  isRunning = false;
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private scannerService: ScannerService,
    private watchlistService: WatchlistService,
    private strategyService: StrategyService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStrategies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get manualCount(): number {
    return this.watchlistService.validateSymbols(this.manualSymbols).symbols.length;
  }

  runScan(): void {
    this.errorMessage = '';
    this.results = [];
    const { symbols, errors } = this.watchlistService.validateSymbols(this.manualSymbols);

    if (this.universe === 'SYMBOLS' && errors.length) {
      this.errorMessage = errors.join(' ');
      return;
    }

    if (this.universe === 'SYMBOLS' && symbols.length === 0) {
      this.errorMessage = 'Provide at least one symbol to scan.';
      return;
    }

    const request = this.scannerService.buildRunRequest(this.universe, symbols, this.strategy || undefined);
    this.isLoading = true;
    this.scannerService
      .runScan(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.notificationService.success('Scanner', 'Scan started.');
          this.fetchStatus(response.runId);
          this.pollStatus(response.runId);
        },
        error: () => {
          this.errorMessage = 'Unable to start scan.';
        }
      });
  }

  cancelRun(): void {
    if (!this.runStatus?.runId) {
      return;
    }
    this.scannerService.cancelRun(this.runStatus.runId).subscribe({
      next: () => {
        this.notificationService.info('Scanner', 'Cancel request sent.');
        this.fetchStatus(this.runStatus!.runId);
      },
      error: () => {
        this.notificationService.error('Scanner', 'Unable to cancel run.');
      }
    });
  }

  refreshResults(): void {
    if (!this.runStatus?.runId) return;
    this.fetchStatus(this.runStatus.runId);
    this.fetchResults(this.runStatus.runId);
  }

  private loadStrategies(): void {
    this.strategyService
      .getStrategyOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.strategyOptions = options ?? [];
      });
  }

  private fetchStatus(runId: string): void {
    this.scannerService.getRunStatus(runId).subscribe({
      next: (status) => {
        this.runStatus = status;
        this.isRunning = status.status === 'RUNNING';
        this.totalSymbols = status.diagnostics?.totalSymbols ?? status.progress?.totalSymbols ?? 0;
        this.diagnostics = status.diagnostics?.rejected ?? {};
        if (status.status !== 'RUNNING') {
          this.fetchResults(runId);
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load scan status.';
      }
    });
  }

  private fetchResults(runId: string): void {
    this.scannerService.getRunResults(runId).subscribe({
      next: (results) => {
        this.results = results ?? [];
      },
      error: () => {
        this.errorMessage = 'Unable to load scan results.';
      }
    });
  }

  private pollStatus(runId: string): void {
    timer(0, 3000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.runStatus || this.runStatus.status === 'RUNNING') {
          this.fetchStatus(runId);
        }
      });
  }
}
