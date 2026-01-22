import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WatchlistComponent } from './watchlist.component';
import { WatchlistService } from '../../core/services/watchlist.service';
import { NotificationService } from '../../core/services/notification.service';

describe('WatchlistComponent', () => {
  let fixture: ComponentFixture<WatchlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistComponent],
      providers: [
        {
          provide: WatchlistService,
          useValue: {
            getWatchlist: () => of(['AAPL']),
            validateSymbols: () => ({ symbols: ['AAPL'], errors: [] }),
            addSymbols: () => of(['AAPL']),
            removeSymbol: () => of(undefined)
          }
        },
        {
          provide: NotificationService,
          useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WatchlistComponent);
    fixture.detectChanges();
  });

  it('loads watchlist on init', () => {
    const component = fixture.componentInstance;
    expect(component.symbols).toEqual(['AAPL']);
  });
});
