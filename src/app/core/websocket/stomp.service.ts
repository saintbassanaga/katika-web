import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, filter, map, share } from 'rxjs';
import { environment } from '../../../environments/environment';

interface StompMessage<T = unknown> {
  destination: string;
  body: T;
}

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  private client!: Client;
  private readonly messages$ = new Subject<StompMessage>();
  private connectPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new (SockJS as any)(environment.wsUrl),
        reconnectDelay: 5000,
        onConnect: () => resolve(),
        onStompError: frame => reject(new Error(frame.headers['message'])),
        onWebSocketError: err => reject(err),
      });
      this.client.activate();
    });

    return this.connectPromise;
  }

  on<T>(destination: string): Observable<T> {
    return this.messages$.pipe(
      filter(msg => msg.destination === destination),
      map(msg => msg.body as T),
      share(),
    );
  }

  subscribe(destination: string): StompSubscription {
    return this.client.subscribe(destination, (frame: IMessage) => {
      this.messages$.next({
        destination,
        body: JSON.parse(frame.body),
      });
    });
  }

  publish(destination: string, body: object): void {
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  disconnect(): void {
    this.connectPromise = null;
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
