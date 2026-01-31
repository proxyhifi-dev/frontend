import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { MainLayoutComponent } from './main-layout.component';
import { StoreService } from '../../core/services/store.service';
import { FyersOAuthService } from '../../core/services/fyers-oauth.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { TradingStoreService } from '../../core/services/trading-store.service';
import { SafetyStatusService } from '../../core/services/safety-status.service';
import { Router } from '@angular/router';

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let component: MainLayoutComponent;
  let triggerGlobalPanic: jasmine.Spy;

  beforeEach(async () => {
    const routerEvents$ = new Subject();
    const storeState$ = new BehaviorSubject({ searchSymbol: '' });
    const mode$ = new BehaviorSubject<'PAPER' | 'LIVE'>('PAPER');

    triggerGlobalPanic = jasmine.createSpy().and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        {
          provide: Router,
          useValue: {
            events: routerEvents$,
            url: '/signals',
            navigate: jasmine.createSpy()
          }
        },
        {
          provide: StoreService,
          useValue: {
            state$: storeState$,
            setSearchSymbol: jasmine.createSpy()
          }
        },
        {
          provide: FyersOAuthService,
          useValue: {
            getFyersStatus: () => of({ connected: false })
          }
        },
        {
          provide: ModeStore,
          useValue: {
            mode$: mode$.asObservable(),
            isLive$: of(false),
            modeSupported$: of(true),
            snapshot: 'PAPER',
            setMode: () => of('PAPER')
          }
        },
        {
          provide: TradingStoreService,
          useValue: {
            accountOverview$: of({ dailyPnl: 0 }),
            riskSummary$: of({ bufferRemaining: 0, portfolioHeat: 0 })
          }
        },
        {
          provide: SafetyStatusService,
          useValue: {
            lockState$: of({ locked: false, mode: 'NORMAL', reason: '' }),
            reconciliation$: of(null),
            emergencyMode$: of(false),
            emergencyStatus$: of(null),
            systemMode$: of('NORMAL'),
            isPanicSupported: () => true,
            triggerGlobalPanic
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows validation error when panic confirmation text is missing', () => {
    component.openPanicConfirm();
    component.panicInput = 'nope';
    component.confirmPanic();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.panic-panel .error');
    expect(errorEl?.textContent).toContain('You must type PANIC to confirm the global kill switch.');
    expect(triggerGlobalPanic).not.toHaveBeenCalled();
  });
});
