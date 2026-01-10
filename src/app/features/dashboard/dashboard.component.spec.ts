import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { TradingStoreService } from '../../core/services/trading-store.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BotService } from '../../core/services/bot.service';
import { StoreService } from '../../core/services/store.service';
import { TradingModeService } from '../../core/services/trading-mode.service';
import { PositionView } from '../../core/models/domain.model';

class TradingStoreStub {
  accountOverview$ = new BehaviorSubject({
    equity: 100000,
    usedMargin: 20000,
    freeMargin: 80000,
    dailyPnl: 1200,
    monthlyPnl: 4500,
    drawdown: 4,
    totalCapital: 100000,
    mode: 'PAPER'
  });
  botStatus$ = new BehaviorSubject({
    state: 'RUNNING',
    isPaused: false,
    lastScan: 'N/A',
    nextScan: 'N/A',
    scanInterval: 45,
    signalsFound: 0
  });
  riskSummary$ = new BehaviorSubject({
    dailyLossLimit: 5000,
    dailyLossUsed: 1000,
    bufferRemaining: 4000,
    maxDrawdown: 4,
    portfolioHeat: 20,
    circuitStatus: 'SAFE'
  });
  strategyHealth$ = new BehaviorSubject({
    status: 'OK',
    reasons: ['Execution within risk guardrails'],
    updatedAt: '10:00 AM',
    isPaused: false,
    canManage: true
  });
  lastUpdate$ = new BehaviorSubject('10:01 AM');
  dashboardLoading$ = new BehaviorSubject(false);
  dashboardError$ = new BehaviorSubject<string | null>(null);
  alerts$ = new BehaviorSubject([]);
  trades$ = new BehaviorSubject([]);
  positions$ = new BehaviorSubject<PositionView[]>([]);

  refreshSnapshot() {
    return of(undefined);
  }

  updateBotStatus() {}
  addAlert() {}
}

class WebSocketServiceStub {
  connect() {
    return of('connected');
  }
}

class BotServiceStub {
  setBotStatus() {
    return of({});
  }
}

class TradingModeServiceStub {
  setMode() {
    return of('PAPER');
  }
}

class StoreServiceStub {
  private stateSubject = new BehaviorSubject({
    isLiveMode: false,
    isSidebarCollapsed: false,
    notifications: [],
    user: { name: 'Trader', capital: 100000 },
    searchSymbol: ''
  });
  state$ = this.stateSubject.asObservable();
  get snapshot() {
    return this.stateSubject.value;
  }
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let tradingStore: TradingStoreStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: TradingStoreService, useClass: TradingStoreStub },
        { provide: WebSocketService, useClass: WebSocketServiceStub },
        { provide: BotService, useClass: BotServiceStub },
        { provide: StoreService, useClass: StoreServiceStub },
        { provide: TradingModeService, useClass: TradingModeServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    tradingStore = TestBed.inject(TradingStoreService) as unknown as TradingStoreStub;
  });

  it('renders from store without manual subscriptions', () => {
    expect(() => fixture.detectChanges()).not.toThrow();

    tradingStore.positions$.next([
      { symbol: 'TCS', quantity: 10, entryPrice: 3200, currentPrice: 3250, pnl: 500 }
    ]);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('TCS');
  });
});
