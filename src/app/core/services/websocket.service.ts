import { Injectable, inject } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';
import { TradingStoreService } from './trading-store.service';

export interface WebSocketMessage {
  type: string;
  data: any;
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
  private readonly wsUrl = this.getWebSocketUrl();
  private toastService = inject(ToastService);
  private store = inject(TradingStoreService);
  private topicSubscriptions = new Map<string, { unsubscribe: () => void }>();
  private recentToastEvents = new Map<string, number>();

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.client = new Client({
      brokerURL: this.wsUrl,
      connectHeaders: {},
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.onConnected();
      },
      onStompError: (frame) => {
        this.onError(frame);
      },
      onWebSocketClose: () => {
        this.onDisconnected();
      }
    });

    this.store.setConnectionStatus('connecting');
    this.client.activate();
  }

  connect(): Observable<'connected' | 'disconnected' | 'connecting' | 'error'> {
    if (this.client && !this.client.active) {
      this.store.setConnectionStatus('connecting');
      this.client.activate();
    }
    return this.store.connectionStatus$;
  }

  subscribe<T>(destination: string): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.client) {
        observer.error(new Error('WebSocket client not initialized'));
        return;
      }

      let subscription: { unsubscribe: () => void } | null = null;
      let intervalId: number | null = null;

      const attachSubscription = () => {
        if (this.client && this.client.connected) {
          subscription = this.client.subscribe(destination, (message: IMessage) => {
            try {
              observer.next(JSON.parse(message.body) as T);
            } catch (error) {
              observer.error(error);
            }
          });
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };

      if (this.client.connected) {
        attachSubscription();
      } else {
        intervalId = window.setInterval(attachSubscription, 500);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    });
  }

  private getWebSocketUrl(): string {
    if (environment.wsUrl) {
      return environment.wsUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8080';
    return `${protocol}//${host}:${port}/ws`;
  }

  private onConnected() {
    console.log(`WebSocket connected: ${this.wsUrl}`);
    this.store.setConnectionStatus('connected');
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    this.toastService.showSuccess('Real-time connection established');
    this.subscribeToTopics();
  }

  private subscribeToTopics() {
    if (!this.client) return;
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
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private maybeToastBotEvent(message: WebSocketMessage) {
    if (message.type !== 'bot-status') {
      return;
    }
    const statusMessage: string | undefined = message.data?.message ?? message.data?.statusMessage;
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

  private onError(frame: any) {
    console.error('WebSocket error:', frame);
    this.store.setConnectionStatus('error');
    this.toastService.showError('Real-time connection error. Retrying...');
    this.attemptReconnect();
  }

  private onDisconnected() {
    console.log('WebSocket disconnected');
    this.store.setConnectionStatus('disconnected');
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.toastService.showError('Unable to establish real-time connection. Please refresh.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectMaxDelay
    );

    console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = window.setTimeout(() => {
      if (this.client && !this.client.active) {
        this.store.setConnectionStatus('connecting');
        this.client.activate();
      }
    }, delay);
  }

  sendMessage(destination: string, body: any) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body)
      });
    } else {
      this.toastService.showWarning('Real-time connection not available');
    }
  }

  disconnect() {
    if (this.client) {
      this.clearTopicSubscriptions();
      this.client.deactivate();
    }
  }
}
