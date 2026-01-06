import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WebSocketService, WebSocketMessage } from '../../core/services/websocket.service';
import { ToastService } from '../../core/services/toast.service';

interface DashboardData {
  totalPnL: number;
  todayPnL: number;
  openPositions: number;
  activeTrades: number;
  winRate: number;
  accountValue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private toastService = inject(ToastService);

  dashboardData: DashboardData = {
    totalPnL: 0,
    todayPnL: 0,
    openPositions: 0,
    activeTrades: 0,
    winRate: 0,
    accountValue: 0
  };

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
  }

  ngOnDestroy() {
    // WebSocket cleanup is handled by the service
  }

  loadDashboardData() {
    this.http.get<DashboardData>('/api/dashboard/summary')
      .subscribe({
        next: (data) => {
          this.dashboardData = data;
        },
        error: () => {
          // Error handled by interceptor
          // Use mock data for development
          this.dashboardData = {
            totalPnL: 15420.50,
            todayPnL: 1250.75,
            openPositions: 5,
            activeTrades: 12,
            winRate: 68.5,
            accountValue: 250000
          };
        }
      });
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
      this.dashboardData.openPositions = data.count;
    }
  }

  private updateTrades(data: any) {
    if (data.count !== undefined) {
      this.dashboardData.activeTrades = data.count;
    }
  }

  private updateBotStatus(data: any) {
    console.log('Bot status update:', data);
  }

  refreshData() {
    this.loadDashboardData();
    this.toastService.showInfo('Refreshing dashboard data...');
  }
}
