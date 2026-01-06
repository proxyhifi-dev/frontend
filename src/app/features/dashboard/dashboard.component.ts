import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { WebSocketService, WebSocketMessage } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';

interface Stats {
  isLiveMode: boolean;
  botStatus: string;
  activePositions: number;
  circuitBreakerStatus: string;
  lastScan: string;
  totalCapital: number;
  todayPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  roi: number;
}

interface Position {
  symbol: string;
  sector: string;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  targetDistance: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private wsService = inject(WebSocketService);
  private toastService = inject(ToastService);

  stats: Stats = {
    isLiveMode: false,
    botStatus: 'ACTIVE',
    activePositions: 2,
    circuitBreakerStatus: 'ARMED',
    lastScan: '2 mins ago',
    totalCapital: 250000,
    todayPnL: 1250.75,
    unrealizedPnL: 450.50,
    winRate: 68.5,
    totalTrades: 45,
    roi: 12.5
  };

  activePositions: Position[] = [
    {
      symbol: 'RELIANCE',
      sector: 'Energy',
      entryPrice: 2450.50,
      currentPrice: 2475.25,
      pnl: 2475,
      pnlPercent: 1.01,
      targetDistance: '₹15 to target'
    },
    {
      symbol: 'TCS',
      sector: 'IT',
      entryPrice: 3650.00,
      currentPrice: 3625.50,
      pnl: -2450,
      pnlPercent: -0.67,
      targetDistance: '₹30 to SL'
    }
  ];

  notifications: any[] = [];
  
  timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  selectedTimeRange = '1M';
  equityData: any[] = [];

  isLoading = false;
  loadingMessage = 'Loading dashboard data...';

  connectionStatus = this.wsService.connectionStatus;

  constructor() {
    // Listen to WebSocket messages using effect
    effect(() => {
      const messages = this.wsService.messages();
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        this.handleWebSocketMessage(latestMessage);
      }
    });

    // Monitor connection status
    effect(() => {
      const status = this.connectionStatus();
      if (status === 'connected') {
        this.toastService.showSuccess('Real-time connection established');
      } else if (status === 'error') {
        this.toastService.showError('Real-time connection error');
      }
    });
  }

  ngOnInit() {
    this.loadDashboardData();
    this.generateMockEquityData();
  }

  ngOnDestroy() {
    // WebSocket cleanup is handled by the service
  }

  loadDashboardData() {
    this.isLoading = true;
    this.http.get<any>('/api/dashboard/summary')
      .subscribe({
        next: (data) => {
          Object.assign(this.stats, data);
          this.isLoading = false;
        },
        error: () => {
          // Error handled by interceptor
          // Use mock data for development
          this.isLoading = false;
        }
      });
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleMode() {
    this.stats.isLiveMode = !this.stats.isLiveMode;
    const mode = this.stats.isLiveMode ? 'LIVE' : 'PAPER';
    this.toastService.showWarning(`Switched to ${mode} mode`);
  }

  toggleNotifications() {
    // Toggle notifications panel
    this.toastService.showInfo('Notifications panel');
  }

  toggleProfile() {
    // Toggle profile menu
    this.toastService.showInfo('Profile menu');
  }

  expandPositions() {
    this.router.navigate(['/positions']);
  }

  closePosition(position: Position) {
    this.toastService.showInfo(`Closing position: ${position.symbol}`);
  }

  modifySL(position: Position) {
    this.toastService.showInfo(`Modifying SL for: ${position.symbol}`);
  }

  setTimeRange(range: string) {
    this.selectedTimeRange = range;
    this.generateMockEquityData();
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'market-data':
        this.updateMarketData(message.data);
        break;
      case 'positions':
        this.updatePositions(message.data);
        break;
      case 'trades':
        this.updateTrades(message.data);
        break;
      case 'bot-status':
        this.updateBotStatus(message.data);
        break;
    }
  }

  private updateMarketData(data: any) {
    console.log('Market data update:', data);
  }

  private updatePositions(data: any) {
    if (data.count !== undefined) {
      this.stats.activePositions = data.count;
    }
  }

  private updateTrades(data: any) {
    if (data.count !== undefined) {
      this.stats.totalTrades = data.count;
    }
  }

  private updateBotStatus(data: any) {
    if (data.status) {
      this.stats.botStatus = data.status;
    }
  }

  private generateMockEquityData() {
    const points = this.selectedTimeRange === '1D' ? 24 : 
                   this.selectedTimeRange === '1W' ? 7 :
                   this.selectedTimeRange === '1M' ? 30 : 90;
    
    this.equityData = Array.from({ length: points }, (_, i) => ({
      date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000),
      value: 250000 + Math.random() * 50000
    }));
  }

  refreshData() {
    this.loadDashboardData();
    this.toastService.showInfo('Refreshing dashboard data...');
  }
}
