import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionService } from '../../core/services/position.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { Position } from '../../core/models/domain.model';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss']
})
export class PositionsComponent implements OnInit {
  activeTab: 'open' | 'closed' = 'open';
  openPositions: Position[] = [];
  closedPositions: Position[] = [];
  isLoading = false;

  constructor(
    private positionSvc: PositionService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.positionSvc.getOpenPositions().subscribe({
      next: (data) => this.openPositions = data,
      error: () => this.notify.error('Error', 'Failed to load open positions')
    });

    this.positionSvc.getClosedPositions().subscribe({
      next: (data) => {
        this.closedPositions = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  closePosition(pos: Position) {
    if (confirm(`Sell ${pos.quantity} qty of ${pos.symbol} at Market Price?`)) {
      this.positionSvc.closePosition(pos.id).subscribe({
        next: () => {
          this.notify.success('Order Sent', `Sell order for ${pos.symbol} submitted.`);
          this.refresh();
        },
        error: (err: any) => this.notify.error('Execution Failed', err.message)
      });
    }
  }
}
