import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-equity-curve-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <h3>Equity Curve</h3>
      <p>Chart coming soon...</p>
    </div>
  `,
  styles: []
})
export class EquityCurveChartComponent {
  @Input() data: any[] = [];
}
