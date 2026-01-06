import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSocketService, WebSocketMessage } from '../../core/services/websocket.service';
import { HttpClient } from '@angular/common/http';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  details?: any;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);

  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  selectedLevel: string = 'ALL';
  autoScroll: boolean = true;

  constructor() {
    // Listen to WebSocket messages for real-time logs
    effect(() => {
      const messages = this.wsService.messages();
      const logsMessages = messages.filter(m => m.type === 'logs');
      
      logsMessages.forEach(message => {
        const logEntry: LogEntry = {
          timestamp: new Date(message.timestamp).toISOString(),
          level: message.data.level || 'INFO',
          message: message.data.message || '',
          details: message.data.details
        };
        
        this.addLog(logEntry);
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
          this.logs = logs;
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
    if (this.selectedLevel === 'ALL') {
      this.filteredLogs = this.logs;
    } else {
      this.filteredLogs = this.logs.filter(log => log.level === this.selectedLevel);
    }
  }

  onLevelChange(level: string) {
    this.selectedLevel = level;
    this.filterLogs();
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
      const element = document.querySelector('.logs-container');
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  private generateMockLogs(): LogEntry[] {
    const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const messages = [
      'Bot started successfully',
      'Market data feed connected',
      'Order executed: BUY RELIANCE',
      'Position opened at 2450.50',
      'Stop loss triggered',
      'Connection retry attempt',
      'Trade completed with profit',
      'Risk limit checked'
    ];

    return Array.from({ length: 50 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      details: Math.random() > 0.5 ? { id: i, value: Math.random() * 1000 } : undefined
    }));
  }

  getLogClass(level: string): string {
    return `log-${level.toLowerCase()}`;
  }
}
