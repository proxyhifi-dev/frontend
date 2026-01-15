import { Injectable, inject } from '@angular/core';
import { Client, IMessage, IFrame, StompSubscription } from '@stomp/stompjs';
import { Observable, BehaviorSubject, filter, take } from 'rxjs';
import SockJS from 'sockjs-client';
import { ApiConfigService } from '../config/api-config.service';
import { ToastService } from './toast.service';
import { TradingStoreService } from './trading-store.service';
import { TokenService } from '../auth/token.service';

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

  private toastService = inject(ToastService);
  private store = inject(TradingStoreService);
  private apiConfig = inject(ApiConfigService);
  private tokenService = inject(TokenService);
  private topicSubscriptions = new Map<string, StompSubscription>();
  private recentToastEvents = new Map<string, number>();

  constructor() {
    this.registerOnlineHandlers();
    this.initializeWebSocket();
  }

  connect(): Observable<'connected' | 'disconnected' | 'connecting' | 'error'> {
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.clearTopicSubscriptions();
    this.client?.deactivate();
    this.setConnectionStatus('disconnected');
  }

  private initializeWebSocket() {
    const wsUrl = this.apiConfig.wsUrl;
    if (!wsUrl) {
      this.setConnectionStatus('error');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
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

    this.setConnectionStatus('connecting');
    this.client.activate();
  }

  private buildHeaders(): Record<string, string> {
    const token = this.tokenService.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    if (frame?.headers?.message) {
      this.toastService.showError('Real-time connection error. Retrying...');
    }
    this.scheduleReconnect();
  }

  private onDisconnected() {
    this.setConnectionStatus('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
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

    this.subscribeTopic('/topic/market-data', 'market-data');
    this.subscribeTopic('/topic/positions', 'positions');
    this.subscribeTopic('/topic/trades', 'trades');
    this.subscribeTopic('/topic/bot-status', 'bot-status');
    this.subscribeTopic('/topic/alerts', 'alerts');
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
      if (this.connectionStatusSubject.value !== 'connected') {
        this.reconnectAttempts = 0;
        this.connect();
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
}
