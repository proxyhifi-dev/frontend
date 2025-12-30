import { Injectable, OnDestroy } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { Observable, BehaviorSubject, ReplaySubject, filter, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  // ReplaySubject(1) ensures late subscribers get the last connection event
  private connected$ = new ReplaySubject<boolean>(1);

  constructor() {
    this.client = new Client({
      brokerURL: environment.wsUrl || 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('✅ WebSocket Connected');
      this.connectionStatus.next(true);
      this.connected$.next(true);
    };

    this.client.onDisconnect = () => {
      console.log('❌ WebSocket Disconnected');
      this.connectionStatus.next(false);
      this.connected$.next(false);
    };

    this.client.activate();
  }

  /**
   * ✅ Improved Subscribe:
   * Waits for the connection to be 'true' before calling client.subscribe
   */
  subscribe(topic: string): Observable<any> {
    return this.connected$.pipe(
      filter(connected => connected === true), // Only proceed if connected
      switchMap(() => new Observable(observer => {
        const sub = this.client.subscribe(topic, (message: Message) => {
          try {
            observer.next(JSON.parse(message.body));
          } catch (err) {
            console.error('Parse error', err);
          }
        });
        return () => sub.unsubscribe();
      }))
    );
  }

  getStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  ngOnDestroy() {
    this.client.deactivate();
  }
}
