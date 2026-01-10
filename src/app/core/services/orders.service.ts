import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getOpenOrders(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>(`${this.apiUrl}/open`);
  }

  getOrderHistory(): Observable<OrderRow[]> {
    return this.http.get<OrderRow[]>(`${this.apiUrl}/history`);
  }
}
