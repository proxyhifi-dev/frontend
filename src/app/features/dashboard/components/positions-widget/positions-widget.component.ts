import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../../../shared/pipes/percent-format.pipe';
import { PositionView } from '../../../../core/models/domain.model';

@Component({
  selector: 'app-positions-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe, PercentFormatPipe],
  templateUrl: './positions-widget.component.html'
})
export class PositionsWidgetComponent {
  @Input() positions: PositionView[] = [];
  @Input() supportsClose = false;
  @Output() closeRequested = new EventEmitter<PositionView>();

  calculatePnL(pos: PositionView): number {
    if (!pos.currentPrice || !pos.entryPrice) return 0;
    return (pos.currentPrice - pos.entryPrice) * pos.quantity;
  }

  getPnLClass(pos: PositionView): string {
    return this.calculatePnL(pos) >= 0 ? 'positive' : 'negative';
  }

  requestClose(pos: PositionView): void {
    if (!this.supportsClose) {
      return;
    }
    this.closeRequested.emit(pos);
  }
}
