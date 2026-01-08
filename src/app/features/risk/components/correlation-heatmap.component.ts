import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface CorrelationData {
  stocks: string[];
  matrix: number[][];
}

@Component({
  selector: 'app-correlation-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-container">
      <div class="heatmap-header">
        <h3>Position Correlation Matrix</h3>
        <span class="info-text">Red = High Correlation | Blue = Low Correlation</span>
      </div>
      
      <div class="heatmap-wrapper">
        <!-- Y-axis labels -->
        <div class="y-axis">
          <div class="y-label" *ngFor="let stock of correlationData.stocks">{{ stock }}</div>
        </div>
        
        <!-- Heatmap grid -->
        <div class="heatmap-grid">
          <div class="heatmap-row" *ngFor="let row of correlationData.matrix">
            <div class="heatmap-cell" 
                 *ngFor="let value of row"
                 [style.background-color]="getCellColor(value)"
                 [title]="value.toFixed(2)">
              {{ value.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- X-axis labels -->
      <div class="x-axis">
        <div class="x-label" *ngFor="let stock of correlationData.stocks">{{ stock }}</div>
      </div>
      
      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color" style="background: #F44336;"></span>
          <span>High (0.7-1.0)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #FF9800;"></span>
          <span>Medium (0.4-0.7)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #2196F3;"></span>
          <span>Low (0-0.4)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-container {
      padding: 20px;
      background: var(--card-bg);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }
    
    .heatmap-header {
      margin-bottom: 20px;
      
      h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
      }
      
      .info-text {
        font-size: 11px;
        color: var(--text-secondary);
      }
    }
    
    .heatmap-wrapper {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .y-axis {
      display: flex;
      flex-direction: column;
      gap: 0;
      justify-content: space-around;
      width: 60px;
      text-align: right;
      padding-right: 10px;
    }
    
    .y-label {
      font-size: 11px;
      color: var(--text-secondary);
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      font-weight: 500;
    }
    
    .heatmap-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    
    .heatmap-row {
      display: flex;
      gap: 0;
    }
    
    .heatmap-cell {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      border: 1px solid rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        z-index: 10;
      }
    }
    
    .x-axis {
      display: flex;
      gap: 0;
      margin-left: 70px;
      padding-top: 10px;
    }
    
    .x-label {
      width: 30px;
      font-size: 11px;
      color: var(--text-secondary);
      text-align: center;
      font-weight: 500;
      transform: rotate(-45deg);
      transform-origin: center;
      height: 30px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    .legend {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid var(--border-color);
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 3px;
    }
  `]
})
export class CorrelationHeatmapComponent implements OnInit, OnChanges {
  @Input() data?: CorrelationData;

  correlationData: CorrelationData = {
    stocks: [],
    matrix: []
  };
  
  ngOnInit(): void {
    if (!this.data && !environment.production) {
      this.generateMockData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.correlationData = this.data;
    }
  }
  
  private generateMockData(): void {
    const stocks = ['TCS', 'RELIANCE', 'INFY', 'WIPRO', 'BAJAJ'];
    const correlations = [
      [1.00, 0.28, 0.65, 0.42, 0.19],
      [0.28, 1.00, 0.38, 0.55, 0.71],
      [0.65, 0.38, 1.00, 0.48, 0.31],
      [0.42, 0.55, 0.48, 1.00, 0.62],
      [0.19, 0.71, 0.31, 0.62, 1.00]
    ];
    
    this.correlationData = {
      stocks,
      matrix: correlations
    };
  }
  
  getCellColor(value: number): string {
    if (value >= 0.7) {
      return this.interpolateColor(value, 0.7, 1.0, '#FF9800', '#F44336');
    } else if (value >= 0.4) {
      return this.interpolateColor(value, 0.4, 0.7, '#2196F3', '#FF9800');
    } else {
      return this.interpolateColor(value, 0, 0.4, '#1565C0', '#2196F3');
    }
  }
  
  private interpolateColor(value: number, min: number, max: number, startColor: string, endColor: string): string {
    const ratio = (value - min) / (max - min);
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);
    
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    
    return `rgb(${r},${g},${b})`;
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
}
