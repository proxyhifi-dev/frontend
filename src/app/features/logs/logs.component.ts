import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService, WebSocketMessage } from '../../core/services/websocket.service';
import { HttpClient } from '@angular/common/http';

interface LogEntry {
  time: Date;
  timestamp?: string;  // For API compatibility
  level: string;
  message: string;
  component: string;
  details?: any;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);

  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  filterLevel: string = 'All';
  liveTail: boolean = true;
  autoScroll: boolean = true;

  constructor() {
    // Listen to WebSocket messages for real-time logs
    effect(() => {
      const messages = this.wsService.messages();
      const logsMessages = messages.filter(m => m.type === 'logs');
      
      logsMessages.forEach(message => {
        const logEntry: LogEntry = {
          time: new Date(message.timestamp),
          timestamp: new Date(message.timestamp).toISOString(),
          level: message.data.level || 'INFO',
          message: message.data.message || '',
          component: message.data.component || 'SYSTEM',
          details: message.data.details
        };
        
        if (this.liveTail) {
          this.addLog(logEntry);
        }
      });
    });
  }

  ngOnInit() {
    this.loadInitialLogs();
  }

  loadInitialLogs() {
    this.http.get<LogEntry[]>('/api/logs')
      .subscribe({
        next: (logs) => {
          this.logs = logs.map(log => ({
            ...log,
            time: new Date(log.timestamp || Date.now())
          }));
          this.filterLogs();
        },
        error: () => {
          // Error handled by interceptor
          // Use mock data for development
          this.logs = this.generateMockLogs();
          this.filterLogs();
        }
      });
  }

  private addLog(log: LogEntry) {
    this.logs.unshift(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
    
    this.filterLogs();
    
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  filterLogs() {
    if (this.filterLevel === 'All') {
      this.filteredLogs = this.logs;
    } else {
      this.filteredLogs = this.logs.filter(log => log.level === this.filterLevel);
    }
  }

  getLevelClass(level: string): string {
    const levelMap: { [key: string]: string } = {
      'INFO': 'badge-info',
      'WARN': 'badge-warning',
      'ERROR': 'badge-error',
      'DEBUG': 'badge-debug'
    };
    return levelMap[level] || 'badge-default';
  }

  clearLogs() {
    this.logs = [];
    this.filteredLogs = [];
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const element = document.querySelector('.logs-stream');
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  private generateMockLogs(): LogEntry[] {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const components = ['BOT', 'STRATEGY', 'RISK', 'BROKER', 'SYSTEM'];
    const messages = [
      'Bot started successfully',
      'Market data feed connected',
      'Order executed: BUY RELIANCE',
      'Position opened at 2450.50',
      'Stop loss triggered',
      'Connection retry attempt',
      'Trade completed with profit',
      'Risk limit checked',
      'Signal generated for TCS',
      'Circuit breaker armed'
    ];

    return Array.from({ length: 50 }, (_, i) => ({
      time: new Date(Date.now() - i * 60000),
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      component: components[Math.floor(Math.random() * components.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      details: Math.random() > 0.5 ? { id: i, value: Math.random() * 1000 } : undefined
    }));
  }
}
