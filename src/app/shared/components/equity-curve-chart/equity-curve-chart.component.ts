import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-equity-curve-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="equity-chart">
      <svg width="100%" height="300" #chart>
        <polyline 
          [attr.points]="pathPoints" 
          fill="none" 
          stroke="#10b981" 
          stroke-width="2"
        />
      </svg>
      <div class="chart-info">
        <p>Showing equity curve for {{ timeRange }}</p>
        <p>Data points: {{ data?.length || 0 }}</p>
      </div>
    </div>
  `,
  styles: [`
    .equity-chart {
      width: 100%;
      height: 300px;
      position: relative;
    }

    svg {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #f9fafb;
    }

    .chart-info {
      margin-top: 10px;
      font-size: 12px;
      color: #666;
    }

    .chart-info p {
      margin: 5px 0;
    }
  `]
})
export class EquityCurveChartComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() timeRange: string = '1M';

  pathPoints = '';

  ngOnChanges() {
    this.generatePath();
  }

  private generatePath() {
    if (!this.data || this.data.length === 0) {
      this.pathPoints = '';
      return;
    }

    const width = 800;
    const height = 280;
    const padding = 20;

    const maxValue = Math.max(...this.data.map(d => d.value));
    const minValue = Math.min(...this.data.map(d => d.value));

    const points = this.data.map((d, i) => {
      const x = padding + (i / (this.data.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (d.value - minValue) / (maxValue - minValue)) * (height - 2 * padding);
      return `${x},${y}`;
    });

    this.pathPoints = points.join(' ');
  }
}
