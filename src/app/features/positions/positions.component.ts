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
    this.notify.warning('Action Unavailable', `Close action for ${pos.symbol} is not exposed by the backend yet.`);
  }
}
