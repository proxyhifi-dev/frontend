import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SignalsComponent } from './signals.component';
import { SignalService } from '../../core/services/signal.service';
import { NotificationService } from '../../core/services/notification.service';
import { StoreService } from '../../core/services/store.service';
import { ModeStore } from '../../core/services/mode-store.service';
import { RiskService } from '../../core/services/risk.service';
import { ScanStoreService } from '../../core/services/scan-store.service';

describe('SignalsComponent', () => {
  let fixture: ComponentFixture<SignalsComponent>;
  let signalService: jasmine.SpyObj<SignalService>;

  beforeEach(async () => {
    signalService = jasmine.createSpyObj('SignalService', [
      'getSignals',
      'getPendingSignals',
      'getSignalDetail',
      'scanNow',
      'executeSignal'
    ]);

    signalService.getSignals.and.returnValue(of([]));
    signalService.getPendingSignals.and.returnValue(of([]));
    signalService.getSignalDetail.and.returnValue(of({
      id: 1,
      symbol: 'AAPL',
      signalScore: 90,
      grade: 'A'
    }));
    signalService.executeSignal.and.returnValue(of(void 0));
    (signalService as any).executionSupported$ = new BehaviorSubject<boolean>(true);

    await TestBed.configureTestingModule({
      imports: [SignalsComponent],
      providers: [
        { provide: SignalService, useValue: signalService },
        { provide: NotificationService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy(), warning: jasmine.createSpy() } },
        { provide: StoreService, useValue: { state$: of({ searchSymbol: '' }), setSearchSymbol: jasmine.createSpy() } },
        { provide: ModeStore, useValue: { mode$: of('PAPER') } },
        { provide: RiskService, useValue: { getCircuitBreakerStatus: () => of({ triggered: false }) } },
        ScanStoreService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignalsComponent);
    fixture.detectChanges();
  });

  it('triggers a single scan POST when scanNow is clicked', () => {
    signalService.scanNow.and.returnValue(of(void 0));

    fixture.componentInstance.scanNow();

    expect(signalService.scanNow).toHaveBeenCalledTimes(1);
  });

  it('does not allow a second scan while one is running', () => {
    const scanSubject = new Subject<void>();
    signalService.scanNow.and.returnValue(scanSubject.asObservable());

    fixture.componentInstance.scanNow();
    fixture.componentInstance.scanNow();

    expect(signalService.scanNow).toHaveBeenCalledTimes(1);

    scanSubject.complete();
  });
});
