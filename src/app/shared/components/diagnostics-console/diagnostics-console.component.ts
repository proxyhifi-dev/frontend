import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnosticsStoreService } from '../../../core/services/diagnostics-store.service';
import { WebSocketService } from '../../../core/websocket/websocket.service';

@Component({
  selector: 'app-diagnostics-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostics-console.component.html',
  styleUrls: ['./diagnostics-console.component.scss']
})
export class DiagnosticsConsoleComponent {
  private diagnosticsStore = inject(DiagnosticsStoreService);
  private webSocketService = inject(WebSocketService);

  readonly httpCalls$ = this.diagnosticsStore.httpCalls$;
  readonly lastBackendError$ = this.diagnosticsStore.lastBackendError$;
  readonly wsStatus$ = this.webSocketService.connectionStatus$;
}
