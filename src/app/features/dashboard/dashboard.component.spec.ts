import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

// ✅ FIXED PATH (service moved)
import { WebSocketService } from '../../core/websocket/websocket.service';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        {
          provide: WebSocketService,
          useValue: {
            connect: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
            disconnect: () => {},
            sendMessage: () => {},
            subscribe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
          }
        }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
