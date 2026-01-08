import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionService } from '../../core/services/position.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PositionView } from '../../core/models/domain.model';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.scss']
})
export class PositionsComponent implements OnInit {
  activeTab: 'open' | 'closed' = 'open';
  openPositions: PositionView[] = [];
  closedPositions: PositionView[] = [];
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

  closePosition(pos: PositionView) {
    if (!pos.id) {
      this.notify.warning('Action Unavailable', `No position ID for ${pos.symbol}.`);
      return;
    }
    this.positionSvc.closePosition(pos.id).subscribe({
      next: () => {
        this.notify.success('Position Closed', `${pos.symbol} has been closed.`);
        this.refresh();
      },
      error: (err: any) => {
        this.notify.error('Close Failed', err?.message || 'Unable to close position.');
      }
    });
  }
}
