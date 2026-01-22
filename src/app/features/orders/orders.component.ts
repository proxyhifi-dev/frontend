import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { OrdersService, OrderRow } from '../../core/services/orders.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  activeTab: 'open' | 'history' = 'open';
  openOrders: OrderRow[] = [];
  historyOrders: OrderRow[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  setTab(tab: 'open' | 'history'): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const source$ = this.activeTab === 'open'
      ? this.ordersService.getOpenOrders()
      : this.ordersService.getOrderHistory();

    source$.pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (orders) => {
        if (this.activeTab === 'open') {
          this.openOrders = orders ?? [];
        } else {
          this.historyOrders = orders ?? [];
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load orders.';
        if (this.activeTab === 'open') {
          this.openOrders = [];
        } else {
          this.historyOrders = [];
        }
      }
    });
  }
}
