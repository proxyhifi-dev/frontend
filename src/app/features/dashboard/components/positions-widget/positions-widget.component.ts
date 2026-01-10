import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';

@Component({
  selector: 'app-positions-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './positions-widget.component.html'
})
export class PositionsWidgetComponent {
  @Input() positions: any[] = [];
  @Input() supportsClose = false;
  @Output() closeRequested = new EventEmitter<any>();

  calculatePnL(pos: any): number {
    if (!pos.currentPrice || !pos.entryPrice) return 0;
    return (pos.currentPrice - pos.entryPrice) * pos.quantity;
  }

  getPnLClass(pos: any): string {
    return this.calculatePnL(pos) >= 0 ? 'positive' : 'negative';
  }

  requestClose(pos: any): void {
    if (!this.supportsClose) {
      return;
    }
    this.closeRequested.emit(pos);
  }
}
