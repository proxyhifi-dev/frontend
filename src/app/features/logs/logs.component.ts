import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for [(ngModel)]
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule], //
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];
  liveTail = true;     // ✅ FIX: Required by HTML
  filterLevel = 'All'; // ✅ FIX: Required by HTML

  private sub = new Subscription();

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    this.sub.add(
      this.ws.subscribe('/topic/logs').subscribe((log: any) => {
        if (log && this.liveTail) {
          if (this.filterLevel === 'All' || log.level === this.filterLevel) {
            this.logs.unshift(log);
            if (this.logs.length > 100) this.logs.pop();
          }
        }
      })
    );
  }

  // ✅ FIX: Required by HTML template
  getLevelClass(level: string): string {
    return `level-${level}`;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
