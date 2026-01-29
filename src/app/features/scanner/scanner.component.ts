import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, finalize, takeUntil, timer } from 'rxjs';
import {
  ScannerResultRow,
  ScannerRunStatus,
  ScannerService,
  ScannerUniverseType
} from '../../core/services/scanner.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { StrategyService } from '../../core/services/strategy.service';
import { DiagnosticsService, DiagnosticsStatusItem } from '../../core/services/diagnostics.service';
import { ToastService } from '../../core/services/toast.service';
import { ScanStoreService } from '../../core/services/scan-store.service';
import { HttpErrorResponse } from '@angular/common/http';
import { mapHttpError } from '../../core/utils/api-error';

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
  diagnosticCounters: Array<{ label: string; value: number }> = [];
  topRejectReasons: Array<{ label: string; count: number }> = [];
  totalSymbols = 0;
  isRunning = false;
  isLoading = false;
  errorMessage = '';
  scannerDisabled = false;
  scanStuckWarning = false;
  diagnosticsSummary: DiagnosticsStatusItem[] = [];
  cooldownRemaining = 0;
  isCooldownActive = false;

  private destroy$ = new Subject<void>();
  private scanStartTime?: number;
  private readonly scanStuckThresholdMs = 20000;
  private pollSub?: Subscription;
  private cooldownSub?: Subscription;

  constructor(
    private scannerService: ScannerService,
    private watchlistService: WatchlistService,
    private strategyService: StrategyService,
    private diagnosticsService: DiagnosticsService,
    private toastService: ToastService,
    private scanStore: ScanStoreService
  ) {}

  ngOnInit(): void {
    this.loadStrategies();
    this.loadDiagnostics();
    this.watchCooldown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollSub?.unsubscribe();
    this.cooldownSub?.unsubscribe();
  }

  get manualCount(): number {
    return this.watchlistService.validateSymbols(this.manualSymbols).symbols.length;
  }

  runScan(): void {
    this.loadDiagnostics();
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
    if (this.isCooldownActive) {
      this.errorMessage = `Rate limited. Try again in ${this.cooldownRemaining}s.`;
      return;
    }

    this.isLoading = true;
    this.isRunning = true;
    this.scanStore.startScan();
    this.scannerService
      .runScan(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.toastService.showSuccess('Scanner: Scan started.');
          this.scanStartTime = Date.now();
          this.runStatus = {
            runId: response.runId,
            status: (response.status as ScannerRunStatus['status']) ?? 'PENDING'
          };
          this.fetchStatus(response.runId);
          this.pollStatus(response.runId);
        },
        error: (err: unknown) => {
          this.isRunning = false;
          this.scanStore.finishScan();
          if (err instanceof HttpErrorResponse) {
            if (err.status === 429) {
              const retryAfter = this.scanStore.retryAfterSeconds || this.cooldownRemaining || 60;
              this.errorMessage = `Rate limited. Retry after ${retryAfter}s.`;
              this.isCooldownActive = true;
              return;
            }
            const apiError = mapHttpError(err);
            this.errorMessage = apiError.userMessage;
            return;
          }
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
        this.toastService.showInfo('Scanner: Cancel request sent.');
        this.fetchStatus(this.runStatus!.runId);
      },
      error: () => {
        this.toastService.showError('Scanner: Unable to cancel run.');
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
        this.isRunning = status.status === 'RUNNING' || status.status === 'PENDING';
        if (!this.isRunning) {
          this.scanStore.finishScan();
        }
        this.totalSymbols = status.diagnostics?.totalSymbols ?? status.progress?.totalSymbols ?? 0;
        this.diagnostics = status.diagnostics?.rejected ?? {};
        this.updateDiagnostics(status);
        if (status.startedAt && !this.scanStartTime) {
          this.scanStartTime = new Date(status.startedAt).getTime();
        }
        this.updateStuckWarning();
        if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
          this.fetchResults(runId);
          this.pollSub?.unsubscribe();
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
    this.pollSub?.unsubscribe();
    this.pollSub = timer(0, 2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.runStatus || this.runStatus.status === 'RUNNING' || this.runStatus.status === 'PENDING') {
          this.fetchStatus(runId);
        } else {
          this.pollSub?.unsubscribe();
        }
      });
  }

  private loadDiagnostics(): void {
    this.diagnosticsService.getDiagnostics().subscribe({
      next: (diagnostics) => {
        this.diagnosticsSummary = this.diagnosticsService.buildIssueSummary(diagnostics);
        this.scannerDisabled = this.diagnosticsService.isScannerDisabled(diagnostics);
      },
      error: () => {
        this.diagnosticsSummary = [];
        this.scannerDisabled = false;
      }
    });
  }

  private watchCooldown(): void {
    this.cooldownSub?.unsubscribe();
    this.cooldownSub = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const until = this.scanStore.cooldownUntil;
        if (!until) {
          this.cooldownRemaining = 0;
          this.isCooldownActive = false;
          return;
        }
        const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        this.cooldownRemaining = remaining;
        this.isCooldownActive = remaining > 0;
        if (!this.isCooldownActive) {
          this.scanStore.clearCooldown();
        }
      });
  }

  private updateStuckWarning(): void {
    const status = this.runStatus?.status;
    if (!status || (status !== 'RUNNING' && status !== 'PENDING')) {
      this.scanStuckWarning = false;
      return;
    }
    const startTime = this.scanStartTime ?? Date.now();
    const elapsedMs = Date.now() - startTime;
    this.scanStuckWarning = elapsedMs > this.scanStuckThresholdMs || status === 'PENDING';
  }

  private updateDiagnostics(status: ScannerRunStatus): void {
    const diagnostics = status.diagnostics ?? {};
    const counters: Record<string, number> = {};
    Object.entries(diagnostics).forEach(([key, value]) => {
      if (key === 'rejected' || value === null || value === undefined) {
        return;
      }
      if (typeof value === 'number') {
        counters[key] = value;
      }
    });

    const progress = status.progress ?? {};
    Object.entries(progress).forEach(([key, value]) => {
      if (typeof value === 'number') {
        counters[key] = value;
      }
    });

    this.diagnosticCounters = Object.entries(counters).map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value
    }));

    const rejected = diagnostics.rejected ?? {};
    this.topRejectReasons = Object.entries(rejected)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
