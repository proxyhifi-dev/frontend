import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { TradingStoreService } from './trading-store.service';
import { DashboardService } from './dashboard.service';
import { PositionService } from './position.service';
import { SettingsService } from './settings.service';
import { RiskService } from './risk.service';
import { StoreService } from './store.service';
import { ToastService } from './toast.service';
import { PositionView } from '../models/domain.model';

class DashboardServiceStub {
  getSummary() {
    return of({});
  }
  getTodayPnL() {
    return of({});
  }
  getUnrealizedPnL() {
    return of({});
  }
  getPerformanceMetrics() {
    return of({});
  }
  getEquityCurve() {
    return of([]);
  }
  getSignals() {
    return of([]);
  }
}

class PositionServiceStub {
  getOpenPositions() {
    return of([]);
  }
  getClosedPositions() {
    return of([]);
  }
}

class SettingsServiceStub {
  loadSettings() {
    return of(null);
  }
}

class RiskServiceStub {
  getCircuitBreakerStatus() {
    return of(null);
  }
}

class ToastServiceStub {
  showError() {}
}

describe('TradingStoreService', () => {
  let service: TradingStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TradingStoreService,
        StoreService,
        { provide: DashboardService, useClass: DashboardServiceStub },
        { provide: PositionService, useClass: PositionServiceStub },
        { provide: SettingsService, useClass: SettingsServiceStub },
        { provide: RiskService, useClass: RiskServiceStub },
        { provide: ToastService, useClass: ToastServiceStub }
      ]
    });

    service = TestBed.inject(TradingStoreService);
  });

  it('updates positions on websocket message', async () => {
    const positions: PositionView[] = [
      { symbol: 'TCS', quantity: 10, entryPrice: 3200, currentPrice: 3250, pnl: 500 }
    ];

    service.handleWebsocketMessage('positions', positions);

    const value = await firstValueFrom(service.positions$);
    expect(value).toEqual(positions);
  });
});
