import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { WebSocketService } from '../../core/websocket/websocket.service';

type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | string;

interface UiLogRow {
  timestamp?: number | string;
  time?: string;

  level: LogLevel;

  // ✅ template expects these sometimes
  component?: string;
  logger?: string;

  message: string;

  thread?: string;
  correlationId?: string;
  requestId?: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  private readonly ws = inject(WebSocketService);
  private readonly subs = new Subscription();

  liveTail = true;
  filterLevel: LogLevel | 'ALL' = 'ALL';

  logs: UiLogRow[] = [];

  ngOnInit(): void {
    const sub = this.ws
      .subscribe<UiLogRow>('/topic/logs')
      .subscribe({
        next: (row) => this.pushLog(row),
        error: () => {
          // do not crash UI
        }
      });

    this.subs.add(sub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private pushLog(row: UiLogRow) {
    const level = (row.level ?? 'INFO') as LogLevel;

    if (
      this.filterLevel !== 'ALL' &&
      String(level).toUpperCase() !== String(this.filterLevel).toUpperCase()
    ) {
      return;
    }

    // ✅ Normalize component field so template never breaks
    const normalized: UiLogRow = {
      ...row,
      level,
      message: row.message ?? '',
      component: row.component ?? row.logger ?? ''
    };

    this.logs.push(normalized);

    if (this.logs.length > 500) this.logs.splice(0, this.logs.length - 500);

    if (this.liveTail) {
      queueMicrotask(() => {
        const el = document.getElementById('logsContainer');
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }

  getLevelClass(level: LogLevel): string {
    const lv = String(level || '').toUpperCase();
    if (lv.includes('ERROR') || lv.includes('FATAL')) return 'badge-danger';
    if (lv.includes('WARN')) return 'badge-warning';
    if (lv.includes('DEBUG') || lv.includes('TRACE')) return 'badge-muted';
    return 'badge-info';
  }
}
