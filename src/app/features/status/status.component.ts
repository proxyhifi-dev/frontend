import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, finalize, interval, takeUntil } from 'rxjs';
import { HealthResponse, HealthService } from '../../core/services/health.service';
import { RuntimeConfigService } from '../../core/config/runtime-config.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import {
  DiagnosticsResponse,
  DiagnosticsService,
  DiagnosticsStatusItem
} from '../../core/services/diagnostics.service';
import { BackendLogsService } from '../../core/services/backend-logs.service';
import { environment } from '../../../environments/environment';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit, OnDestroy {
  health: HealthResponse | null = null;
  brokerStatus: string = 'Unknown';
  isLoading = false;
  configAvailable = true;
  diagnosticsLoading = false;
  diagnosticsSupported = false;
  diagnostics: DiagnosticsResponse | null = null;
  diagnosticsItems: DiagnosticsStatusItem[] = [];
  diagnosticsError = '';
  logsSupported = false;
  logsLoading = false;
  logsError = '';
  logLines: string[] = [];
  isDevMode = !environment.production;
  readonly emptyStates = EMPTY_STATE_MESSAGES;

  private destroy$ = new Subject<void>();

  constructor(
    private healthService: HealthService,
    private runtimeConfig: RuntimeConfigService,
    private fyersOAuthService: FyersOAuthService,
    private diagnosticsService: DiagnosticsService,
    private backendLogsService: BackendLogsService
  ) {}

  ngOnInit(): void {
    this.configAvailable = this.runtimeConfig.isConfigAvailable();
    this.loadHealth();
    this.loadBrokerStatus();
    this.diagnosticsSupported = this.diagnosticsService.isSupported();
    this.logsSupported = this.backendLogsService.isSupported();
    this.loadDiagnostics();
    this.loadLogs();

    if (this.isDevMode && this.logsSupported) {
      interval(5000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadLogs();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHealth(): void {
    this.isLoading = true;
    this.healthService
      .getHealth()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (health) => (this.health = health),
        error: () => (this.health = null)
      });
  }

  loadDiagnostics(): void {
    if (!this.diagnosticsSupported) {
      return;
    }
    this.diagnosticsLoading = true;
    this.diagnosticsError = '';
    this.diagnosticsService
      .getDiagnostics()
      .pipe(finalize(() => (this.diagnosticsLoading = false)))
      .subscribe({
        next: (diagnostics) => {
          this.diagnostics = diagnostics;
          this.diagnosticsItems = this.diagnosticsService.buildStatusItems(diagnostics);
        },
        error: () => {
          this.diagnosticsError = 'Unable to load diagnostics.';
          this.diagnostics = null;
          this.diagnosticsItems = [];
        }
      });
  }

  loadLogs(): void {
    if (!this.logsSupported) {
      return;
    }
    this.logsLoading = true;
    this.logsError = '';
    this.backendLogsService
      .getLogs()
      .pipe(finalize(() => (this.logsLoading = false)))
      .subscribe({
        next: (lines) => {
          this.logLines = lines ?? [];
        },
        error: () => {
          this.logsError = 'Unable to load backend logs.';
          this.logLines = [];
        }
      });
  }

  get diagnosticsExtras(): Array<{ key: string; value: string }> {
    if (!this.diagnostics || !this.isDevMode) {
      return [];
    }
    const knownKeys = new Set([
      'scanner',
      'watchlist',
      'bot',
      'fyers',
      'scannerEnabled',
      'scannerDisabled',
      'scannerStatus',
      'watchlistCount',
      'watchlistSymbols',
      'botThreadAlive',
      'fyersConfigured'
    ]);

    return Object.entries(this.diagnostics)
      .filter(([key]) => !knownKeys.has(key))
      .map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      }));
  }

  loadBrokerStatus(): void {
    if (!this.runtimeConfig.hasEndpoint('/auth/fyers/status')) {
      this.brokerStatus = 'Not exposed';
      return;
    }
    this.fyersOAuthService.getFyersStatus().subscribe({
      next: (status) => {
        if (!status) {
          this.brokerStatus = 'Unknown';
          return;
        }
        if (status.tokenStatus) {
          this.brokerStatus = status.tokenStatus;
          return;
        }
        this.brokerStatus = status.connected ? 'Connected' : 'Disconnected';
      },
      error: () => {
        this.brokerStatus = 'Unavailable';
      }
    });
  }
}
