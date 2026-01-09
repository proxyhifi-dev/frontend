import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService, TradingSettings } from '../../core/services/settings.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  activeTab = 'trading';
  isSaving = false;
  brokerStatus: 'CONNECTED' | 'DISCONNECTED' | 'LOADING' = 'LOADING';

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
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        this.config = settings;
      },
      error: () => {
        this.notificationService.error('Backend unavailable. Unable to load settings.');
      }
    });
    this.refreshBrokerStatus();
  }

  save(): void {
    this.isSaving = true;
    this.settingsService.saveSettings(this.config)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => this.notificationService.success('Saved to server.'),
        error: () => this.notificationService.error('Failed to save settings to server.')
      });
  }

  connectBroker(): void {
    this.fyersService.getAuthUrl().subscribe({
      next: (response: any) => {
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        }
      },
      error: () => this.notificationService.error('Failed to initiate broker connection.')
    });
  }

  disconnectBroker(): void {
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
    this.fyersService.getFyersStatus().subscribe({
      next: (status) => {
        this.brokerStatus = status.connected ? 'CONNECTED' : 'DISCONNECTED';
      },
      error: () => {
        this.brokerStatus = 'DISCONNECTED';
      }
    });
  }
}
