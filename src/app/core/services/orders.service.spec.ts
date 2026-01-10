import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService } from './orders.service';
import { environment } from '../../../environments/environment';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches open orders', () => {
    service.getOpenOrders().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/orders/open`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('fetches order history', () => {
    service.getOrderHistory().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/orders/history`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
