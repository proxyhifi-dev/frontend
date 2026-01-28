import { Component } from '@angular/core';
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
  readonly httpCalls$;
  readonly lastBackendError$;
  readonly wsStatus$;
  readonly runtimeConfig$;

  constructor(
    private diagnosticsStore: DiagnosticsStoreService,
    private webSocketService: WebSocketService,
    private runtimeConfig: RuntimeConfigService
  ) {
    this.httpCalls$ = diagnosticsStore.httpCalls$;
    this.lastBackendError$ = diagnosticsStore.lastBackendError$;
    this.wsStatus$ = webSocketService.connectionStatus$;
    this.runtimeConfig$ = runtimeConfig.config$;
  }
}
