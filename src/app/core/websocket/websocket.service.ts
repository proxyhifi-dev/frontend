import { Injectable, inject } from '@angular/core';
import { Client, IMessage, IFrame, StompSubscription } from '@stomp/stompjs';
import { Observable, BehaviorSubject, filter, take } from 'rxjs';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { ToastService } from '../services/toast.service';
import { TradingStoreService } from '../services/trading-store.service';



export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout?: number;
  private readonly maxReconnectAttempts = 6;
  private readonly reconnectBaseDelay = 1000;
  private readonly reconnectMaxDelay = 30000;
  private readonly connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting' | 'error'>(
    'disconnected'
  );
  readonly connectionStatus$ = this.connectionStatusSubject.asObservable();

  private toastService = inject(ToastService);
  private store = inject(TradingStoreService);
  private runtimeConfig = inject(RuntimeConfigService);
  private topicSubscriptions = new Map<string, StompSubscription>();
  private recentToastEvents = new Map<string, number>();
  private isEnabled = false;
  private authToken?: string;

  constructor() {
    this.registerOnlineHandlers();
  }

  connect(authToken: string): Observable<'connected' | 'disconnected' | 'connecting' | 'error'> {
    this.isEnabled = true;
    this.authToken = authToken;
    if (!authToken) {
      this.toastService.showWarning('Real-time connection requires login.');
      return this.connectionStatusSubject.asObservable();
    }
    if (!this.client) {
      this.initializeWebSocket();
    }
    if (this.client && !this.client.active) {
      this.setConnectionStatus('connecting');
      this.client.activate();
    }
    return this.connectionStatusSubject.asObservable();
  }

  subscribe<T>(destination: string): Observable<T> {
    return new Observable<T>((observer) => {
      let subscription: StompSubscription | null = null;
      const ensureSubscription = () => {
        if (this.client && this.client.connected) {
          subscription = this.client.subscribe(destination, (message: IMessage) => {
            try {
              observer.next(JSON.parse(message.body) as T);
            } catch (error) {
              observer.error(error);
            }
          });
        }
      };

      if (this.client?.connected) {
        ensureSubscription();
      } else {
        const statusSub = this.connectionStatusSubject
          .pipe(filter((status) => status === 'connected'), take(1))
          .subscribe(() => ensureSubscription());

        return () => {
          statusSub.unsubscribe();
          subscription?.unsubscribe();
        };
      }

      return () => {
        subscription?.unsubscribe();
      };
    });
  }

  sendMessage(destination: string, body: unknown) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body)
      });
    } else {
      this.toastService.showWarning('Real-time connection not available');
    }
  }

  disconnect(): void {
    this.isEnabled = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.clearTopicSubscriptions();
    this.client?.deactivate();
    this.setConnectionStatus('disconnected');
  }

  private initializeWebSocket() {
    const wsUrl = this.runtimeConfig.wsUrl;
    if (!wsUrl) {
      this.setConnectionStatus('error');
      this.toastService.showError('WebSocket URL unavailable. Check server configuration.');
      return;
    }

    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: this.buildHeaders(),
      beforeConnect: () => {
        if (this.client) {
          this.client.connectHeaders = this.buildHeaders();
        }
      },
      debug: () => {},
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => this.onConnected(),
      onStompError: (frame) => this.onError(frame),
      onWebSocketClose: () => this.onDisconnected(),
      onWebSocketError: () => this.onDisconnected()
    });
  }

  private buildHeaders(): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  private onConnected() {
    this.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.toastService.showSuccess('Real-time connection established');
    this.subscribeToTopics();
  }

  private onError(frame: IFrame) {
    this.setConnectionStatus('error');
    if (frame?.headers?.['message']) {
      this.toastService.showError('Real-time connection error. Retrying...');
    }
    this.scheduleReconnect();
  }

  private onDisconnected() {
    this.setConnectionStatus('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (!this.isEnabled) {
      return;
    }
    if (!navigator.onLine) {
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.toastService.showError('Unable to establish real-time connection. Please refresh.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectMaxDelay
    );

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.client && !this.client.active) {
        this.setConnectionStatus('connecting');
        this.client.activate();
      }
    }, delay);
  }

  private subscribeToTopics() {
    if (!this.client) {
      return;
    }
    this.clearTopicSubscriptions();
    this.subscribeTopic('/user/queue/positions', 'positions');
    this.subscribeTopic('/user/queue/orders', 'orders');
    this.subscribeTopic('/user/queue/summary', 'summary');
    this.subscribeTopic('/user/queue/bot-status', 'bot-status');
    this.subscribeTopic('/user/queue/signals', 'signals');
    this.subscribeTopic('/user/queue/logs', 'logs');

    this.getEnabledTopics().forEach((topic) => {
      const normalized = topic.startsWith('/') ? topic : `/${topic}`;
      this.subscribeTopic(normalized, normalized.replace('/topic/', ''));
    });
  }

  private subscribeTopic(destination: string, type: string) {
    if (!this.client || this.topicSubscriptions.has(destination)) {
      return;
    }
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      this.handleMessage(type, message);
    });
    this.topicSubscriptions.set(destination, subscription);
  }

  private clearTopicSubscriptions() {
    this.topicSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.topicSubscriptions.clear();
  }

  private handleMessage(type: string, message: IMessage) {
    try {
      const data = JSON.parse(message.body);
      const wsMessage: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now()
      };

      this.store.handleWebsocketMessage(wsMessage.type, wsMessage.data);
      this.maybeToastBotEvent(wsMessage);
    } catch {
      this.toastService.showWarning('Realtime update failed to parse.');
    }
  }

  private maybeToastBotEvent(message: WebSocketMessage) {
    if (message.type !== 'bot-status') {
      return;
    }
    const payload = message.data as { message?: string; statusMessage?: string } | null;
    const statusMessage: string | undefined = payload?.message ?? payload?.statusMessage;
    if (!statusMessage) {
      return;
    }

    if (statusMessage.toLowerCase().includes('scan started')) {
      const toastKey = 'scan-started';
      if (this.shouldShowToast(toastKey, 5000)) {
        this.toastService.showInfo(statusMessage, 3000);
      }
    }
  }

  private shouldShowToast(key: string, cooldownMs: number): boolean {
    const now = Date.now();
    const last = this.recentToastEvents.get(key) ?? 0;
    if (now - last < cooldownMs) {
      return false;
    }
    this.recentToastEvents.set(key, now);
    return true;
  }

  private registerOnlineHandlers(): void {
    window.addEventListener('online', () => {
      if (this.connectionStatusSubject.value !== 'connected' && this.isEnabled && this.authToken) {
        this.reconnectAttempts = 0;
        this.connect(this.authToken);
      }
    });

    window.addEventListener('offline', () => {
      this.setConnectionStatus('disconnected');
    });
  }

  private setConnectionStatus(status: 'connected' | 'disconnected' | 'connecting' | 'error') {
    this.connectionStatusSubject.next(status);
    this.store.setConnectionStatus(status);
  }

  private getEnabledTopics(): string[] {
    return this.runtimeConfig.wsTopics.filter((topic) => topic.startsWith('/topic/'));
  }
}
