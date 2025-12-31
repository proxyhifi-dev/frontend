import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RiskHealth {
  dailyLossLimit: number;
  currentLoss: number;
  bufferRemaining: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  maxDrawdown: number;
  portfolioHeat: number;
}

@Component({
  selector: 'app-risk-health-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="risk-health-widget">
      <div class="widget-header">
        <h3>Risk Health</h3>
        <span class="risk-badge" [class]="'risk-' + riskHealth.riskLevel.toLowerCase()">
          {{ riskHealth.riskLevel }} Risk
        </span>
      </div>
      
      <div class="health-metrics">
        <!-- Daily Loss Progress -->
        <div class="metric-section">
          <div class="metric-label">
            <span>Daily Loss Limit</span>
            <span class="values">₹{{ currentLossFormatted }} / ₹{{ limitFormatted }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="lossPercentage" [class]="'progress-' + riskHealth.riskLevel.toLowerCase()"></div>
          </div>
        </div>
        
        <!-- Buffer Remaining -->
        <div class="metric-grid">
          <div class="metric-item">
            <label>Buffer Remaining</label>
            <span class="metric-value" [class.critical]="riskHealth.bufferRemaining < 1000">
              ₹{{ bufferFormatted }}
            </span>
          </div>
          
          <div class="metric-item">
            <label>Max Drawdown</label>
            <span class="metric-value">{{ riskHealth.maxDrawdown }}%</span>
          </div>
          
          <div class="metric-item">
            <label>Portfolio Heat</label>
            <span class="metric-value" [class.hot]="riskHealth.portfolioHeat > 70">
              {{ riskHealth.portfolioHeat }}%
            </span>
          </div>
        </div>
      </div>
      
      <!-- Risk Indicator -->
      <div class="risk-indicator">
        <div class="indicator-dot" [class]="'dot-' + riskHealth.riskLevel.toLowerCase()"></div>
        <span class="indicator-text">
          {{ getHealthMessage() }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .risk-health-widget {
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
      
      h3 {
        margin: 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }
    }
    
    .risk-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      
      &.risk-low {
        background: rgba(0, 200, 83, 0.1);
        color: #00C853;
      }
      
      &.risk-medium {
        background: rgba(255, 193, 7, 0.1);
        color: #FFC107;
      }
      
      &.risk-high {
        background: rgba(255, 107, 0, 0.1);
        color: #FF6B00;
      }
      
      &.risk-critical {
        background: rgba(244, 67, 54, 0.1);
        color: #F44336;
      }
    }
    
    .health-metrics {
      margin-bottom: 20px;
    }
    
    .metric-section {
      margin-bottom: 16px;
    }
    
    .metric-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      .values {
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
      
      &.progress-low {
        background: #00C853;
      }
      
      &.progress-medium {
        background: #FFC107;
      }
      
      &.progress-high {
        background: #FF6B00;
      }
      
      &.progress-critical {
        background: #F44336;
      }
    }
    
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    
    .metric-item {
      display: flex;
      flex-direction: column;
      
      label {
        font-size: 11px;
        color: var(--text-secondary);
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .metric-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        
        &.critical {
          color: #F44336;
        }
        
        &.hot {
          color: #FF6B00;
        }
      }
    }
    
    .risk-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 6px;
      
      .indicator-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        
        &.dot-low {
          background: #00C853;
        }
        
        &.dot-medium {
          background: #FFC107;
        }
        
        &.dot-high {
          background: #FF6B00;
        }
        
        &.dot-critical {
          background: #F44336;
          animation: pulse 1s infinite;
        }
      }
      
      .indicator-text {
        font-size: 12px;
        color: var(--text-secondary);
        flex: 1;
      }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class RiskHealthWidgetComponent implements OnInit {
  riskHealth: RiskHealth = {
    dailyLossLimit: 10000,
    currentLoss: 2500,
    bufferRemaining: 7500,
    riskLevel: 'Low',
    maxDrawdown: 12.5,
    portfolioHeat: 35
  };
  
  currentLossFormatted: string = '0';
  limitFormatted: string = '0';
  bufferFormatted: string = '0';
  lossPercentage: number = 0;
  
  ngOnInit(): void {
    this.updateMetrics();
  }
  
  private updateMetrics(): void {
    this.currentLossFormatted = (this.riskHealth.currentLoss / 1000).toFixed(1) + 'K';
    this.limitFormatted = (this.riskHealth.dailyLossLimit / 1000).toFixed(1) + 'K';
    this.bufferFormatted = (this.riskHealth.bufferRemaining / 1000).toFixed(1) + 'K';
    this.lossPercentage = (this.riskHealth.currentLoss / this.riskHealth.dailyLossLimit) * 100;
    this.updateRiskLevel();
  }
  
  private updateRiskLevel(): void {
    const lossPercentage = (this.riskHealth.currentLoss / this.riskHealth.dailyLossLimit) * 100;
    
    if (lossPercentage >= 75) {
      this.riskHealth.riskLevel = 'Critical';
    } else if (lossPercentage >= 50) {
      this.riskHealth.riskLevel = 'High';
    } else if (lossPercentage >= 25) {
      this.riskHealth.riskLevel = 'Medium';
    } else {
      this.riskHealth.riskLevel = 'Low';
    }
  }
  
  getHealthMessage(): string {
    const lossPercentage = (this.riskHealth.currentLoss / this.riskHealth.dailyLossLimit) * 100;
    
    if (lossPercentage >= 75) {
      return '⚠️ CRITICAL: Daily loss limit nearly reached!';
    } else if (lossPercentage >= 50) {
      return '⚠️ HIGH RISK: 50% of daily limit used';
    } else if (lossPercentage >= 25) {
      return '⚡ MEDIUM RISK: 25% of daily limit used';
    } else {
      return '✅ HEALTHY: Risk exposure is low';
    }
  }
}
