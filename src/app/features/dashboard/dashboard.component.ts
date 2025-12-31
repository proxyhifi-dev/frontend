import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services/dashboard.service';
import { PositionService } from '../../core/services/position.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription, forkJoin, takeUntil } from 'rxjs/operators';
import { BotService } from '../../core/services/bot.service';
import { Subject } from 'rxjs';

export interface DashboardStats {
  todayPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  portfolioValue: number;
  accountBalance: number;
  equityUsed: number;
  equityAvailable: number;
  isLiveMode: boolean;
  botStatus: string;
  activePositions: number;
  circuitBreakerStatus: string;
  lastScan: string;
  nextScan: string;
  scannedStocks: number;
  totalStocks: number;
  signalsFound: number;
  roi: number;
  totalCapital: number;
  dailyLossLimit: number;
  dailyLossUsed: number;
  dailyBuffer: number;
  consecutiveLosses: number;
  maxDrawdown: number;
  isPaused: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = {
    todayPnL: 0,
    unrealizedPnL: 0,
    winRate: 0,
    totalTrades: 0,
    portfolioValue: 0,
    accountBalance: 0,
    equityUsed: 0,
    equityAvailable: 0,
    isLiveMode: false,
    botStatus: 'IDLE',
    activePositions: 0,
    circuitBreakerStatus: 'SAFE',
    lastScan: 'N/A',
    nextScan: 'N/A',
    scannedStocks: 0,
    totalStocks: 0,
    signalsFound: 0,
    roi: 0,
    totalCapital: 0,
    dailyLossLimit: 5000,
    dailyLossUsed: 0,
    dailyBuffer: 5000,
    consecutiveLosses: 0,
    maxDrawdown: 0,
    isPaused: false
  };

  activePositions: any[] = [];
  newSignals: any[] = [];
  notifications: any[] = [];
  equityData: any[] = [];
  timeRanges: string[] = ['1D', '5D', '1M', '3M', '6M', '1Y'];
  selectedTimeRange: string = '1D';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor(
    private dashboardService: DashboardService,
    private positionService: PositionService,
    private wsService: WebSocketService,
    private botService: BotService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupWebSocketSubscriptions();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const sub = this.dashboardService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data: any) => {
          this.stats = { ...this.stats, ...data };
          this.isLoading = false;
        },
        (error: any) => {
          console.error('Failed to load dashboard stats', error);
          this.isLoading = false;
        }
      );
    this.subscriptions.push(sub);
  }

  setupWebSocketSubscriptions(): void {
    if (this.wsService.connect) {
      const sub = this.wsService.connect()
        .pipe(takeUntil(this.destroy$))
        .subscribe();
      this.subscriptions.push(sub);
    }
  }

  toggleMode(): void {
    this.stats.isLiveMode = !this.stats.isLiveMode;
    if (this.dashboardService.toggleMode) {
      this.dashboardService.toggleMode(this.stats.isLiveMode).subscribe();
    }
  }

  toggleNotifications(): void {
    // Toggle notifications visibility
  }

  toggleProfile(): void {
    // Toggle profile menu
  }

  pauseBot(): void {
    this.stats.isPaused = !this.stats.isPaused;
    if (this.dashboardService.pauseTrading && !this.stats.isPaused) {
      this.dashboardService.pauseTrading().subscribe();
    } else if (this.dashboardService.resumeTrading && this.stats.isPaused) {
      this.dashboardService.resumeTrading().subscribe();
    }
  }

  scanNow(): void {
    // Trigger immediate scan
    if (this.botService.scanNow) {
      this.botService.scanNow().subscribe();
    }
  }

  setTimeRange(range: string): void {
    this.selectedTimeRange = range;
  }

  expandPositions(): void {
    // Open full positions view
  }

  closePosition(position: any): void {
    if (this.positionService.closePosition) {
      this.positionService.closePosition(position.id).subscribe();
    }
  }

  modifySL(position: any): void {
    // Open modify stop loss dialog
  }

  approveSignal(signal: any): void {
    // Approve trading signal
  }

  rejectSignal(signal: any): void {
    // Reject trading signal
  }

  viewAllSignals(): void {
    // Navigate to full signals view
  }

  viewFullRisk(): void {
    // Navigate to risk page
  }

  navigateToDashboard(): void {
    // Navigate back to dashboard (for logo click)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
