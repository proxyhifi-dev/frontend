import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModeStore } from './mode-store.service';
import { PortfolioService } from '../portfolio/portfolio.service';

export interface OrderRow {
  id: string | number;
  symbol?: string;
  side?: string;
  quantity?: number;
  price?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private modeStore: ModeStore, private portfolio: PortfolioService) {}

  getOpenOrders(): Observable<OrderRow[]> {
    return this.getOrders().pipe(
      map((orders) => orders.filter((order) => !this.isClosedStatus(order.status)))
    );
  }

  getOrderHistory(): Observable<OrderRow[]> {
    return this.getOrders().pipe(
      map((orders) => orders.filter((order) => this.isClosedStatus(order.status)))
    );
  }

  private getOrders(): Observable<OrderRow[]> {
    return this.modeStore.snapshot === 'LIVE'
      ? this.portfolio.getLiveOrders()
      : this.portfolio.getPaperOrders();
  }

  private isClosedStatus(status?: string): boolean {
    const normalized = status?.toUpperCase();
    return ['FILLED', 'COMPLETE', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(normalized ?? '');
  }
}
