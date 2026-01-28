import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagnosticsStoreService } from '../../../core/services/diagnostics-store.service';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { RuntimeConfigService } from '../../../core/config/runtime-config.service';

@Component({
  selector: 'app-diagnostics-console',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostics-console.component.html',
  styleUrls: ['./diagnostics-console.component.scss']
})
export class DiagnosticsConsoleComponent {
  private readonly diagnosticsStore = inject(DiagnosticsStoreService);
  private readonly webSocketService = inject(WebSocketService);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  readonly httpCalls$ = this.diagnosticsStore.httpCalls$;
  readonly lastBackendError$ = this.diagnosticsStore.lastBackendError$;
  readonly wsStatus$ = this.webSocketService.connectionStatus$;
  readonly runtimeConfig$ = this.runtimeConfig.config$;
}
