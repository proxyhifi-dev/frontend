import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { OrdersService, OrderDetail } from '../../core/services/orders.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyInrPipe],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order?: OrderDetail;
  isLoading = false;
  errorMessage = '';
  isCancelling = false;

  constructor(private route: ActivatedRoute, private ordersService: OrdersService) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  get canCancel(): boolean {
    const status = this.order?.status?.toUpperCase();
    return !!status && !['FILLED', 'COMPLETE', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(status);
  }

  cancelOrder(): void {
    if (!this.order || this.isCancelling) {
      return;
    }
    this.isCancelling = true;
    this.ordersService.cancelOrder(this.order.id).pipe(finalize(() => (this.isCancelling = false))).subscribe({
      next: () => {
        this.loadOrder(this.order!.id.toString());
      },
      error: () => {
        this.errorMessage = 'Unable to cancel order.';
      }
    });
  }

  private loadOrder(orderId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.ordersService
      .getOrderDetails(orderId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (order) => (this.order = order),
        error: () => (this.errorMessage = 'Unable to load order details.')
      });
  }
}
