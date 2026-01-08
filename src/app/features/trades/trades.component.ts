import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PositionService } from '../../core/services/position.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-trades',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyInrPipe],
  templateUrl: './trades.component.html',
  styleUrls: ['./trades.component.scss']
})
export class TradesComponent implements OnInit {
  tradeHistory: any[] = [];
  filteredTrades: any[] = [];
  filters = {
    symbol: '',
    grade: 'All',
    mode: 'All',
    startDate: '',
    endDate: ''
  };

  constructor(private positionSvc: PositionService) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.positionSvc.getClosedPositions().subscribe(data => {
      this.tradeHistory = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    const symbol = this.filters.symbol.trim().toLowerCase();
    const grade = this.filters.grade;
    const mode = this.filters.mode;
    const start = this.filters.startDate ? new Date(this.filters.startDate) : null;
    const end = this.filters.endDate ? new Date(this.filters.endDate) : null;

    this.filteredTrades = this.tradeHistory.filter(trade => {
      const matchesSymbol = !symbol || trade.symbol?.toLowerCase().includes(symbol);
      const matchesGrade = grade === 'All' || trade.grade === grade;
      const matchesMode = mode === 'All' || (mode === 'Paper' && trade.isPaperTrade) || (mode === 'Live' && !trade.isPaperTrade);
      const tradeDate = trade.exitTime ? new Date(trade.exitTime) : null;
      const matchesStart = !start || (tradeDate && tradeDate >= start);
      const matchesEnd = !end || (tradeDate && tradeDate <= end);
      return matchesSymbol && matchesGrade && matchesMode && matchesStart && matchesEnd;
    });
  }

  resetFilters() {
    this.filters = {
      symbol: '',
      grade: 'All',
      mode: 'All',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
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
