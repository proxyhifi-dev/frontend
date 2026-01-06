import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-risk-health-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget risk-widget">
      <div class="widget-header">
        <h2>RISK HEALTH</h2>
        <span class="health-status" [class.healthy]="isHealthy">{{ healthStatus }}</span>
      </div>
      <div class="widget-body">
        <div class="risk-meter">
          <div class="meter-bar">
            <div class="meter-fill" [style.width.%]="riskLevel"></div>
          </div>
          <span class="meter-label">Risk Level: {{ riskLevel }}%</span>
        </div>
        <div class="risk-metrics">
          <div class="metric">
            <span class="label">Daily Loss Limit</span>
            <span class="value">₹{{ dailyLossLimit | number }}</span>
          </div>
          <div class="metric">
            <span class="label">Max Drawdown</span>
            <span class="value">{{ maxDrawdown }}%</span>
          </div>
          <div class="metric">
            <span class="label">Position Size</span>
            <span class="value">{{ positionSize }}%</span>
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

    .health-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      background: #fee2e2;
      color: #991b1b;
    }

    .health-status.healthy {
      background: #d1fae5;
      color: #065f46;
    }

    .risk-meter {
      margin-bottom: 20px;
    }

    .meter-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .meter-fill {
      height: 100%;
      background: linear-gradient(to right, #10b981, #f59e0b, #ef4444);
      transition: width 0.3s;
    }

    .meter-label {
      font-size: 12px;
      color: #666;
    }

    .risk-metrics {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }

    .metric .label {
      font-size: 12px;
      color: #666;
    }

    .metric .value {
      font-size: 14px;
      font-weight: 600;
    }
  `]
})
export class RiskHealthWidgetComponent {
  isHealthy = true;
  healthStatus = 'HEALTHY';
  riskLevel = 35;
  dailyLossLimit = 5000;
  maxDrawdown = 12.5;
  positionSize = 4;
}
