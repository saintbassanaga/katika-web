import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

import { DisputeService, DisputeMessage } from '../dispute.service';
import { StompService } from '@core/websocket/stomp.service';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-dispute-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TimeAgoPipe],
  template: `
    <div class="flex flex-col h-screen bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <a routerLink="/disputes" class="text-gray-500">←</a>
        <div class="flex-1">
          <h1 class="text-sm font-bold text-gray-900">Litige</h1>
          <p class="text-xs text-gray-500">{{ disputeId() }}</p>
        </div>
        <app-status-badge [status]="disputeStatus()" />
      </div>

      <!-- Messages -->
      <div #messagesContainer class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        @for (msg of messages(); track msg.id) {
          <div class="flex" [class.justify-end]="isOwnMessage(msg)">
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2.5"
              [class.bg-blue-600]="isOwnMessage(msg)"
              [class.text-white]="isOwnMessage(msg)"
              [class.bg-white]="!isOwnMessage(msg)"
              [class.shadow-sm]="!isOwnMessage(msg)"
            >
              @if (!isOwnMessage(msg)) {
                <p class="text-xs font-semibold text-blue-600 mb-1">
                  {{ msg.authorName }}
                </p>
              }
              <p class="text-sm">{{ msg.content }}</p>
              <p class="text-xs mt-1 opacity-70 text-right">
                {{ msg.createdAt | timeAgo }}
              </p>
            </div>
          </div>
        }

        @if (typingUsers().length > 0) {
          <div class="flex">
            <div class="bg-white rounded-2xl px-4 py-2.5 shadow-sm">
              <p class="text-xs text-gray-500">
                {{ typingUsers()[0] }} est en train d'écrire...
              </p>
            </div>
          </div>
        }
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-end sticky bottom-0">
        <textarea
          [(ngModel)]="messageText"
          (input)="onTyping()"
          (keydown.enter)="$event.preventDefault(); sendMessage()"
          placeholder="Votre message..."
          rows="1"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                 resize-none focus:border-blue-600 focus:outline-none max-h-24 overflow-y-auto"
        ></textarea>

        <button
          (click)="sendMessage()"
          [disabled]="!messageText.trim() || sending()"
          class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center
                 hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
        >
          ▶
        </button>
      </div>
    </div>
  `
})
export class DisputeChatComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly stomp = inject(StompService);
  private readonly auth = inject(AuthStore);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;

  protected readonly disputeId = signal<string>('');
  protected readonly messages = signal<DisputeMessage[]>([]);
  protected readonly typingUsers = signal<string[]>([]);
  protected readonly sending = signal(false);
  protected readonly disputeStatus = signal('OPEN');

  protected messageText = '';

  private messageSub?: StompSubscription;
  private typingSub?: StompSubscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('Missing dispute ID in route');
      return;
    }

    this.disputeId.set(id);

    // 1️⃣ Charger historique via REST
    const history = await firstValueFrom(
      this.disputeService.getMessages(id)
    );

    this.messages.set(history);
    setTimeout(() => this.scrollToBottom(), 100);

    // 2️⃣ Connexion WebSocket
    await this.stomp.connect();

    // 3️⃣ Subscribe messages
    this.messageSub = this.stomp.subscribe(`/topic/dispute.${id}`);
    this.stomp.on<DisputeMessage>(`/topic/dispute.${id}`)
      .subscribe(msg => {
        this.messages.update(m => [...m, msg]);
        this.scrollToBottom();
      });

    // 4️⃣ Subscribe typing
    this.typingSub = this.stomp.subscribe(`/topic/dispute.${id}.typing`);
    this.stomp.on<{ userId: string; userName: string; typing: boolean }>(
      `/topic/dispute.${id}.typing`
    ).subscribe(event => {

      const currentUserId = (this.auth as any).user?.()?.id;
      if (event.userId === currentUserId) return;

      this.typingUsers.update(users =>
        event.typing
          ? [...new Set([...users, event.userName])]
          : users.filter(u => u !== event.userName)
      );
    });
  }

  // ✅ ENVOI MESSAGE VIA STOMP (PLUS DE POST HTTP)
  protected sendMessage(): void {

    const content = this.messageText.trim();
    if (!content) return;

    this.sending.set(true);

    this.stomp.publish(
      `/app/dispute/${this.disputeId()}/message`,
      {
        content,
        internalOnly: false
      }
    );

    this.messageText = '';
    this.sending.set(false);
  }

  protected onTyping(): void {

    this.stomp.publish(
      `/app/dispute/${this.disputeId()}/typing`,
      { typing: true }
    );

    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.stomp.publish(
        `/app/dispute/${this.disputeId()}/typing`,
        { typing: false }
      );
    }, 2000);
  }

  protected isOwnMessage(msg: DisputeMessage): boolean {
    return msg.authorId === (this.auth as any).user?.()?.id;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    this.messageSub?.unsubscribe();
    this.typingSub?.unsubscribe();
  }
}
