import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { ScannerComponent } from './scanner.component';
import { ScannerService } from '../../core/services/scanner.service';
import { WatchlistService } from '../../core/services/watchlist.service';
import { StrategyService } from '../../core/services/strategy.service';
import { NotificationService } from '../../core/services/notification.service';

describe('ScannerComponent', () => {
  let fixture: ComponentFixture<ScannerComponent>;
  let scannerService: jasmine.SpyObj<ScannerService>;

  beforeEach(async () => {
    scannerService = jasmine.createSpyObj('ScannerService', [
      'buildRunRequest',
      'runScan',
      'getRunStatus',
      'getRunResults',
      'cancelRun'
    ]);

    scannerService.buildRunRequest.and.callFake((type, symbols, strategy) => ({
      universe: { type, symbols },
      strategy
    }));
    scannerService.runScan.and.returnValue(of({ runId: '1' }));
    scannerService.getRunStatus.and.returnValue(of({ runId: '1', status: 'COMPLETED' }));
    scannerService.getRunResults.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ScannerComponent],
      providers: [
        { provide: ScannerService, useValue: scannerService },
        { provide: WatchlistService, useValue: { validateSymbols: () => ({ symbols: ['AAPL'], errors: [] }) } },
        { provide: StrategyService, useValue: { getStrategyOptions: () => of([]) } },
        { provide: NotificationService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy(), info: jasmine.createSpy() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerComponent);
    fixture.detectChanges();
  });

  it('starts a scan when runScan is triggered', fakeAsync(() => {
    const component = fixture.componentInstance;
    component.universe = 'SYMBOLS';
    component.manualSymbols = 'AAPL';
    component.runScan();
    tick();

    expect(scannerService.runScan).toHaveBeenCalled();
    component.ngOnDestroy();
  }));
});
