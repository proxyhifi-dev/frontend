import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Contains standard 'currency' pipe
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-positions-widget',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ Removed CurrencyInrPipe
  templateUrl: './positions-widget.component.html'
})
export class PositionsWidgetComponent {
  @Input() positions: any[] = [];

  calculatePnL(pos: any): number {
    if (!pos.currentPrice || !pos.entryPrice) return 0;
    return (pos.currentPrice - pos.entryPrice) * pos.quantity;
  }

  getPnLClass(pos: any): string {
    return this.calculatePnL(pos) >= 0 ? 'positive' : 'negative';
  }
}
