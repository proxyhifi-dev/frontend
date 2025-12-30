import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-container">
      <h1>Analytics</h1>
      <p>Performance analytics coming soon...</p>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 20px;
    }
  `]
})
export class AnalyticsComponent {}

// Add default export for lazy loading
export default AnalyticsComponent;
