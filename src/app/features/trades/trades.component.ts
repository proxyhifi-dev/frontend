import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionService } from '../../core/services/position.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-trades',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.scss']
})
export class TradesComponent implements OnInit {
  tradeHistory: any[] = [];
  filters = {
    symbol: '',
    grade: 'All',
    mode: 'All'
  };

  constructor(private positionSvc: PositionService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.positionSvc.getClosedPositions().subscribe(data => {
      this.tradeHistory = data;
    });
  }

  getExitClass(reason: string): string {
    switch(reason) {
      case 'TARGET': return 'badge-target';
      case 'STOP_LOSS': return 'badge-sl';
      case 'TIME_EXIT': return 'badge-time';
      default: return 'badge-neutral';
    }
  }
}
