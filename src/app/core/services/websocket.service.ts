import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private state$ = new BehaviorSubject<string>('DISCONNECTED');

  constructor() {
    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('✅ WebSocket Connected');
      this.state$.next('CONNECTED');
    };

    this.client.onStompError = (frame) => {
      console.error('❌ Broker reported error: ' + frame.headers['message']);
      this.state$.next('ERROR');
    };

    this.client.activate();
  }

  // Added method to satisfy DashboardComponent
  public connect(): Observable<any> {
    if (!this.client.active) {
      this.client.activate();
    }
    return this.state$.asObservable();
  }

  public subscribe(topic: string): Observable<any> {
    return new Observable(observer => {
      const checkConnection = setInterval(() => {
        if (this.client.connected) {
          clearInterval(checkConnection);
          this.client.subscribe(topic, message => {
            if (message.body) {
              observer.next(JSON.parse(message.body));
            }
          });
        }
      }, 500);
    });
  }
}
