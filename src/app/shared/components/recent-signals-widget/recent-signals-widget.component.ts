import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-signals-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget signals-widget">
      <div class="widget-header">
        <h2>RECENT SIGNALS</h2>
      </div>
      <div class="widget-body">
        <div class="signal-item" *ngFor="let signal of signals">
          <div class="signal-header">
            <span class="symbol">{{ signal.symbol }}</span>
            <span class="time">{{ signal.time }}</span>
          </div>
          <div class="signal-details">
            <span class="action" [class.buy]="signal.action === 'BUY'" [class.sell]="signal.action === 'SELL'">
              {{ signal.action }}
            </span>
            <span class="price">₹{{ signal.price }}</span>
            <span class="confidence">{{ signal.confidence }}% confidence</span>
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

    .widget-header h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 15px 0;
    }

    .signal-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .signal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .symbol {
      font-weight: 600;
      font-size: 14px;
    }

    .time {
      font-size: 12px;
      color: #666;
    }

    .signal-details {
      display: flex;
      gap: 12px;
      font-size: 12px;
    }

    .action {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .action.buy {
      background: #d1fae5;
      color: #065f46;
    }

    .action.sell {
      background: #fee2e2;
      color: #991b1b;
    }

    .confidence {
      color: #666;
    }
  `]
})
export class RecentSignalsWidgetComponent {
  signals = [
    { symbol: 'RELIANCE', action: 'BUY', price: 2450, time: '2 mins ago', confidence: 85 },
    { symbol: 'TCS', action: 'SELL', price: 3650, time: '15 mins ago', confidence: 78 },
    { symbol: 'INFY', action: 'BUY', price: 1580, time: '1 hour ago', confidence: 92 }
  ];
}
