import { Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { ToastService } from './toast.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private readonly wsUrl = this.getWebSocketUrl();
  private toastService = inject(ToastService);
  private topicSubscriptions = new Map<string, { unsubscribe: () => void }>();

  connectionStatus = signal<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  readonly connectionStatus$ = toObservable(this.connectionStatus);
  messages = signal<WebSocketMessage[]>([]);

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.client = new Client({
      brokerURL: this.wsUrl,
      connectHeaders: {
        // Add auth token if needed
        // 'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: this.reconnectDelay,
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

    this.connectionStatus.set('connecting');
    this.client.activate();
  }

  connect(): Observable<'connected' | 'disconnected' | 'connecting' | 'error'> {
    if (this.client && !this.client.active) {
      this.client.activate();
    }
    return this.connectionStatus$;
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
    const port = '8080'; // Your backend port
    return `${protocol}//${host}:${port}/ws`;
  }

  private onConnected() {
    console.log(`WebSocket connected: ${this.wsUrl}`);
    this.connectionStatus.set('connected');
    this.reconnectAttempts = 0;
    this.toastService.showSuccess('Real-time connection established');

    // Subscribe to topics
    this.subscribeToTopics();
  }

  private subscribeToTopics() {
    if (!this.client) return;
    this.clearTopicSubscriptions();

    this.subscribeTopic('/topic/market-data', 'market-data');
    this.subscribeTopic('/topic/positions', 'positions');
    this.subscribeTopic('/topic/trades', 'trades');
    this.subscribeTopic('/topic/bot-status', 'bot-status');
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
      
      this.messages.update(msgs => [...msgs.slice(-99), wsMessage]); // Keep last 100 messages
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private onError(frame: any) {
    console.error('WebSocket error:', frame);
    this.connectionStatus.set('error');
    this.toastService.showError('Real-time connection error. Retrying...');
    this.attemptReconnect();
  }

  private onDisconnected() {
    console.log('WebSocket disconnected');
    this.connectionStatus.set('disconnected');
    this.attemptReconnect();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.toastService.showError('Unable to establish real-time connection. Please refresh.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    setTimeout(() => {
      if (this.client && !this.client.active) {
        this.connectionStatus.set('connecting');
        this.client.activate();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
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
