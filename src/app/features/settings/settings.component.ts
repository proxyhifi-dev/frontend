import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService, TradingSettings } from '../../core/services/settings.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { BrokerConnectionStatus, BrokerErrorLog } from '../../core/models/broker.dto';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeTab = 'trading';
  isSaving = false;
  brokerStatus: 'CONNECTED' | 'DISCONNECTED' | 'LOADING' = 'LOADING';
  brokerDetails?: BrokerConnectionStatus;
  brokerErrors: BrokerErrorLog[] = [];
  brokerLoading = false;
  brokerLogsLoading = false;
  brokerErrorMessage = '';
  storageMode: 'remote' | 'local' = 'remote';
  disconnectSupported = true;
  errorLogsSupported = true;
  private destroy$ = new Subject<void>();

  // Settings Config Model
  config: TradingSettings = {
    mode: 'PAPER',
    maxPositions: 3,
    riskLimits: { maxRiskPerTradePercent: 1.0, maxDailyLossPercent: 5 }
  };

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private fyersService: FyersOAuthService
  ) {}

  ngOnInit(): void {
    this.settingsService.storageMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mode) => {
        this.storageMode = mode;
      });
    this.fyersService.disconnectSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.disconnectSupported = supported;
      });
    this.fyersService.errorLogsSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.errorLogsSupported = supported;
      });

    this.settingsService.loadSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings) => {
        this.config = settings;
      },
      error: () => {
        this.notificationService.error('Backend unavailable. Unable to load settings.');
      }
    });
    this.refreshBrokerStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save(): void {
    this.isSaving = true;
    this.settingsService.saveSettings(this.config)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          const message = this.storageMode === 'local' ? 'Saved locally.' : 'Saved to server.';
          this.notificationService.success(message);
        },
        error: () => this.notificationService.error('Failed to save settings to server.')
      });
  }

  connectBroker(): void {
    this.fyersService.getAuthUrl().subscribe({
      next: (response) => {
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        }
      },
      error: () => this.notificationService.error('Failed to initiate broker connection.')
    });
  }

  disconnectBroker(): void {
    if (!this.disconnectSupported) {
      this.notificationService.warning('Disconnect not supported by current backend.', 'Action unavailable');
      return;
    }
    this.fyersService.disconnectFyers().subscribe({
      next: () => {
        this.notificationService.success('Broker disconnected.');
        this.refreshBrokerStatus();
      },
      error: () => this.notificationService.error('Failed to disconnect broker.')
    });
  }

  refreshBrokerStatus(): void {
    this.brokerStatus = 'LOADING';
    this.brokerLoading = true;
    this.brokerErrorMessage = '';
    this.fyersService.getFyersStatus().pipe(finalize(() => (this.brokerLoading = false))).subscribe({
      next: (status) => {
        this.brokerDetails = status;
        this.brokerStatus = status.connected ? 'CONNECTED' : 'DISCONNECTED';
        this.loadBrokerErrors();
      },
      error: () => {
        this.brokerStatus = 'DISCONNECTED';
        this.brokerErrorMessage = 'Unable to load broker status.';
      }
    });
  }

  loadBrokerErrors(): void {
    if (!this.errorLogsSupported) {
      this.brokerErrors = [];
      this.brokerLogsLoading = false;
      return;
    }
    this.brokerLogsLoading = true;
    this.fyersService.getFyersErrors().subscribe({
      next: (logs) => {
        this.brokerErrors = logs ?? [];
        this.brokerLogsLoading = false;
      },
      error: () => {
        this.brokerErrors = [];
        this.brokerLogsLoading = false;
      }
    });
  }
}
