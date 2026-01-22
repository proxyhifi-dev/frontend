import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpBaseService } from '../http/http-base.service';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface OrderRow {
  id: string | number;
  symbol?: string;
  side?: string;
  quantity?: number;
  price?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  isPaper?: boolean;
  broker?: string;
}

export interface OrderEvent {
  status?: string;
  timestamp?: string;
  message?: string;
}

export interface OrderDetail extends OrderRow {
  events?: OrderEvent[];
  notes?: string;
}

export interface CreateOrderRequest {
  symbol: string;
  side: string;
  quantity: number;
  price?: number;
  orderType?: string;
  mode?: 'PAPER' | 'LIVE';
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(private http: HttpBaseService, private runtimeConfig: RuntimeConfigService) {}

  isSupported(): boolean {
    return this.runtimeConfig.hasEndpoint('GET', '/orders') || this.runtimeConfig.hasEndpoint('/orders');
  }

  createOrder(request: CreateOrderRequest): Observable<OrderDetail> {
    return this.http.post<OrderDetail>('/orders', request);
  }

  getOpenOrders(): Observable<OrderRow[]> {
    return this.listOrders().pipe(
      map((orders) => orders.filter((order) => !this.isClosedStatus(order.status)))
    );
  }

  getOrderHistory(): Observable<OrderRow[]> {
    return this.listOrders().pipe(
      map((orders) => orders.filter((order) => this.isClosedStatus(order.status)))
    );
  }

  listOrders(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>('/orders');
  }

  getOrderDetails(orderId: string | number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`/orders/${encodeURIComponent(String(orderId))}`);
  }

  cancelOrder(orderId: string | number): Observable<void> {
    return this.http.post<void>(`/orders/${encodeURIComponent(String(orderId))}/cancel`, {});
  }

  private isClosedStatus(status?: string): boolean {
    const normalized = status?.toUpperCase();
    return ['FILLED', 'COMPLETE', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(normalized ?? '');
  }
}
