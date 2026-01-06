import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bot-status-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget bot-status-widget">
      <div class="widget-header">
        <h2>BOT STATUS</h2>
        <span class="status-indicator" [class.active]="isActive"></span>
      </div>
      <div class="widget-body">
        <div class="status-grid">
          <div class="status-item">
            <span class="label">Status</span>
            <span class="value">{{ status }}</span>
          </div>
          <div class="status-item">
            <span class="label">Uptime</span>
            <span class="value">{{ uptime }}</span>
          </div>
          <div class="status-item">
            <span class="label">Signals Today</span>
            <span class="value">{{ signalsToday }}</span>
          </div>
          <div class="status-item">
            <span class="label">Trades Executed</span>
            <span class="value">{{ tradesExecuted }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .widget {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .widget-header h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ccc;
    }

    .status-indicator.active {
      background: #10b981;
      animation: pulse 2s infinite;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }

    .status-item {
      display: flex;
      flex-direction: column;
    }

    .status-item .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
    }

    .status-item .value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class BotStatusWidgetComponent {
  isActive = true;
  status = 'RUNNING';
  uptime = '4h 32m';
  signalsToday = 12;
  tradesExecuted = 8;
}
