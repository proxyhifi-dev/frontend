import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './kpi-card.html',
  styles: [`
    .kpi-container {
      padding: 20px;
      min-width: 200px;
      border-left: 4px solid var(--accent);
    }
    .kpi-container.up { border-left-color: var(--green); }
    .kpi-container.down { border-left-color: var(--red); }
    .label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; }
    .main-val { font-size: 24px; font-weight: bold; margin: 8px 0; font-family: var(--font-mono); }
  `]
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() prefix: string = '₹';
  @Input() percentChange?: number;
}
