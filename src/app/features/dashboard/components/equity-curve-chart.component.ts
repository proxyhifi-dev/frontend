import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-equity-curve-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equity-curve-chart.component.html',
  styleUrls: ['./equity-curve-chart.component.scss']
})
export class EquityCurveChartComponent implements OnChanges {
  // ✅ FIX: Added missing Input decorators
  @Input() data: any[] = [];
  @Input() timeRange: string = '1D';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['timeRange']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    // Logic to render or update your chart (e.g., using Chart.js or D3)
    console.log(`Updating chart for range: ${this.timeRange} with ${this.data.length} points`);
  }
}
