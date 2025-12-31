import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Fix: Required for [(ngModel)]
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Fix: Added FormsModule
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: any[] = [];

  // ✅ Fix: Define variables used in HTML
  liveTail = true;
  filterLevel = 'All';

  private sub = new Subscription();

  constructor(private ws: WebSocketService) {}

  ngOnInit() {
    this.sub.add(
      this.ws.subscribe('/topic/logs').subscribe((log: any) => {
        if (log) {
          // Filter logic
          if (this.filterLevel !== 'All' && log.level !== this.filterLevel) {
            return;
          }
          // Live tail logic
          if (this.liveTail) {
            this.logs.unshift(log);
            if (this.logs.length > 200) this.logs.pop();
          }
        }
      })
    );
  }

  // ✅ Fix: Define the helper function used in HTML
  getLevelClass(level: string): string {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARN': return 'text-yellow-400';
      case 'ERROR': return 'text-red-500';
      case 'TRADE': return 'text-green-400 font-bold';
      default: return 'text-gray-300';
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
