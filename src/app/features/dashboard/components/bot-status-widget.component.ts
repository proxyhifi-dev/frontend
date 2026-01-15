import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotService, BotStatus } from '../../../core/services/bot.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bot-status-widget',
  standalone: true, // ✅ Must be true to avoid NG2012
  imports: [CommonModule],
  template: `
    <div class="bot-status-widget">
      <div class="widget-header">
        <h3>Bot Status</h3>
        <div class="status-indicator" [class.active]="botStatus.isActive" [class.paused]="!botStatus.isActive">
          <span class="dot"></span>
          {{ botStatus.status }}
        </div>
      </div>

      <div class="status-grid">
        <div class="status-item">
          <label>Next Scan</label>
          <span class="value">{{ countdownTime }}</span>
        </div>

        <div class="status-item">
          <label>Scanned / Total</label>
          <span class="value">{{ botStatus.scannedStocks }}/{{ botStatus.totalStocks }}</span>
        </div>

        <div class="status-item">
          <label>Last Scan</label>
          <span class="value">{{ lastScanFormatted }}</span>
        </div>

        <div class="status-item">
          <label>Strategy</label>
          <span class="value">{{ botStatus.currentStrategy }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button
          (click)="toggleBotStatus()"
          class="btn-toggle"
          [disabled]="!controlSupported"
          [attr.title]="controlSupported ? '' : 'Backend bot control endpoint pending'"
        >
          {{ botStatus.isActive ? 'Pause' : 'Resume' }} Bot
        </button>
        <button (click)="triggerScan()" class="btn-scan" [disabled]="botStatus.isActive">
          Force Scan
        </button>
      </div>
    </div>
  `,
  styles: [`
    .bot-status-widget {
      padding: 20px;
      background: var(--card-bg);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .widget-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      background: rgba(0, 200, 83, 0.1);
      color: #00C853;
      font-size: 12px;
      font-weight: 600;
    }

    .status-indicator.paused {
      background: rgba(255, 107, 0, 0.1);
      color: #FF6B00;
    }

    .status-indicator .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00C853;
      display: inline-block;
      animation: pulse 2s infinite;
    }

    .status-indicator.paused .dot {
      background: #FF6B00;
      animation: none;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .status-item {
      display: flex;
      flex-direction: column;
    }

    .status-item label {
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-item .value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .action-buttons {
      display: flex;
      gap: 10px;
    }

    .action-buttons button {
      flex: 1;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      border: none;
      transition: all 0.3s ease;
    }

    .action-buttons button:hover:not(:disabled) {
      opacity: 0.9;
    }

    .action-buttons button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-buttons .btn-toggle {
      background: var(--accent);
      color: white;
    }

    .action-buttons .btn-scan {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class BotStatusWidgetComponent implements OnInit, OnDestroy {
  botStatus: BotStatus = {
    isActive: true,
    status: 'Running',
    nextScanTime: new Date(Date.now() + 30000),
    scannedStocks: 50,
    totalStocks: 50,
    lastScanTime: new Date(Date.now() - 60000),
    currentStrategy: 'MACD + RSI'
  };

  countdownTime: string = '0:30';
  lastScanFormatted: string = '1m ago';
  controlSupported = false;

  private destroy$ = new Subject<void>();

  constructor(private botService: BotService) {}

  ngOnInit(): void {
    this.startCountdownTimer();
    this.subscribeToBotStatus();
    this.botService.controlSupported$
      .pipe(takeUntil(this.destroy$))
      .subscribe((supported) => {
        this.controlSupported = supported;
      });
  }

  private startCountdownTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const now = new Date();
        const diff = Math.max(0, (this.botStatus.nextScanTime.getTime() - now.getTime()) / 1000);
        const minutes = Math.floor(diff / 60);
        const seconds = Math.floor(diff % 60);
        this.countdownTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.updateLastScanTime();
      });
  }

  private updateLastScanTime(): void {
    const now = new Date();
    const diff = (now.getTime() - this.botStatus.lastScanTime.getTime()) / 1000;

    if (diff < 60) {
      this.lastScanFormatted = Math.floor(diff) + 's ago';
    } else if (diff < 3600) {
      this.lastScanFormatted = Math.floor(diff / 60) + 'm ago';
    } else {
      this.lastScanFormatted = Math.floor(diff / 3600) + 'h ago';
    }
  }

  private subscribeToBotStatus(): void {
    this.botService.getBotStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status: BotStatus) => {
          if (status) {
            this.botStatus = { ...this.botStatus, ...status };
          }
        }
      });
  }

  toggleBotStatus(): void {
    if (!this.controlSupported) {
      return;
    }
    const newStatus: BotStatus['status'] = this.botStatus.isActive ? 'Paused' : 'Running';
    this.botService.setBotStatus(newStatus === 'Running')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.botStatus.isActive = newStatus === 'Running';
          this.botStatus.status = newStatus;
        }
      });
  }

  triggerScan(): void {
    this.botService.triggerManualScan()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.botStatus.lastScanTime = new Date();
          this.botStatus.nextScanTime = new Date(Date.now() + 30000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
