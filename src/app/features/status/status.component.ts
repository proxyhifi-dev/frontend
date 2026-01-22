import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { HealthResponse, HealthService } from '../../core/services/health.service';
import { RuntimeConfigService } from '../../core/config/runtime-config.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.scss']
})
export class StatusComponent implements OnInit {
  health: HealthResponse | null = null;
  brokerStatus: string = 'Unknown';
  isLoading = false;
  configAvailable = true;

  constructor(
    private healthService: HealthService,
    private runtimeConfig: RuntimeConfigService,
    private fyersOAuthService: FyersOAuthService
  ) {}

  ngOnInit(): void {
    this.configAvailable = this.runtimeConfig.isConfigAvailable();
    this.loadHealth();
    this.loadBrokerStatus();
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
