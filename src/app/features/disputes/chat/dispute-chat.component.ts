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
import { TitleCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

import { DisputeService, DisputeDetail, DisputeMessage } from '../dispute.service';
import { StompService } from '@core/websocket/stomp.service';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-dispute-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TimeAgoPipe, TitleCasePipe, TranslatePipe],
  template: `
    <div class="flex flex-col h-screen bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <a routerLink="/disputes" class="text-gray-500 hover:text-gray-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          @if (dispute()) {
            <h1 class="text-sm font-bold text-gray-900 truncate">
              {{ dispute()!.buyerName }} &amp; {{ dispute()!.sellerName }}
            </h1>
            @if (typingUsers().length > 0) {
              <p class="text-xs text-blue-500 truncate">{{ typingUsers()[0] }} est en train d'écrire…</p>
            } @else {
              <p class="text-xs text-gray-500 truncate">
                {{ dispute()!.description || dispute()!.transactionRef }}
                · {{ formatXAF(dispute()!.grossAmount, dispute()!.currency) }}
              </p>
            }
          } @else {
            <h1 class="text-sm font-bold text-gray-900">Litige</h1>
            <p class="text-xs text-gray-400">Chargement…</p>
          }
        </div>
        <app-status-badge [status]="disputeStatus()" />
      </div>

      <!-- Messages Container -->
      <div
        #messagesContainer
        class="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
        (scroll)="onScroll()"
      >
        <div class="flex flex-col space-y-3 min-h-full">
          <!-- Messages -->
          @for (msg of messages(); track msg.id) {

            @if (isStaffMessage(msg)) {
              <!-- System / Support / Admin message — centré -->
              <div class="flex justify-center px-2">
                <div class="max-w-[75%] flex flex-col items-center gap-1">
                  <!-- Badge rôle -->
                  <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    [class.bg-amber-100]="msg.messageType === 'SYSTEM'"
                    [class.text-amber-700]="msg.messageType === 'SYSTEM'"
                    [class.bg-indigo-100]="msg.messageType !== 'SYSTEM'"
                    [class.text-indigo-700]="msg.messageType !== 'SYSTEM'"
                  >
                    @if (msg.messageType === 'SYSTEM') {
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {{ 'disputes.chat.system' | translate }}
                    } @else {
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {{ msg.senderRole | titlecase }} · {{ msg.senderName }}
                    }
                  </span>
                  <!-- Bulle centrée -->
                  <div class="rounded-2xl px-4 py-2 text-center"
                    [class.bg-amber-50]="msg.messageType === 'SYSTEM'"
                    [class.border]="true"
                    [class.border-amber-200]="msg.messageType === 'SYSTEM'"
                    [class.bg-indigo-50]="msg.messageType !== 'SYSTEM'"
                    [class.border-indigo-200]="msg.messageType !== 'SYSTEM'"
                  >
                    <p class="text-sm italic break-words whitespace-pre-wrap"
                      [class.text-amber-800]="msg.messageType === 'SYSTEM'"
                      [class.text-indigo-800]="msg.messageType !== 'SYSTEM'"
                    >{{ msg.content }}</p>
                    <p class="text-[10px] mt-1 opacity-60"
                      [class.text-amber-600]="msg.messageType === 'SYSTEM'"
                      [class.text-indigo-600]="msg.messageType !== 'SYSTEM'"
                    >{{ msg.createdAt | timeAgo }}</p>
                  </div>
                </div>
              </div>

            } @else {
              <!-- Message utilisateur — gauche / droite -->
              <div class="flex w-full" [class.justify-end]="isOwnMessage(msg)">
                <div
                  class="max-w-[80%] rounded-2xl px-4 py-2.5"
                  [class.bg-blue-600]="isOwnMessage(msg)"
                  [class.text-white]="isOwnMessage(msg)"
                  [class.bg-white]="!isOwnMessage(msg)"
                  [class.shadow-sm]="!isOwnMessage(msg)"
                >
                  @if (!isOwnMessage(msg)) {
                    <p class="text-xs font-semibold text-blue-600 mb-1">
                      {{ msg.senderName }}
                    </p>
                  }
                  <p class="text-sm break-words whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-xs mt-1 opacity-70 text-right">
                    {{ msg.createdAt | timeAgo }}
                  </p>
                </div>
              </div>
            }

          }

          <!-- Bottom anchor for scroll -->
          <div #scrollAnchor class="h-0"></div>
        </div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-end sticky bottom-0 shadow-lg">
        <textarea
          [(ngModel)]="messageText"
          (input)="onTyping()"
          (keydown.enter)="$event.preventDefault(); sendMessage()"
          placeholder="Votre message..."
          rows="1"
          class="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm
                 resize-none focus:border-blue-600 focus:outline-none max-h-24 overflow-y-auto
                 transition-colors duration-200"
        ></textarea>

        <button
          (click)="sendMessage()"
          [disabled]="!messageText.trim() || sending()"
          class="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center
                 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50
                 disabled:cursor-not-allowed shrink-0 transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    /* Custom scrollbar */
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }

    /* Message animations */
    .max-w-\\[80\\%\\] {
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Typing indicator animation */
    .typing-indicator {
      position: relative;
    }

    .typing-indicator::after {
      content: '...';
      position: absolute;
      width: 20px;
      animation: typingDots 1.5s steps(4) infinite;
    }

    @keyframes typingDots {
      0%, 20% { content: ''; }
      40% { content: '.'; }
      60% { content: '..'; }
      80%, 100% { content: '...'; }
    }

    /* Scroll smooth behavior */
    .scroll-smooth {
      scroll-behavior: smooth;
    }

    /* Ensure messages container takes full height */
    .flex-1.overflow-y-auto {
      height: calc(100vh - 130px); /* Adjust based on header + input height */
    }
  `]
})
export class DisputeChatComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly stomp = inject(StompService);
  private readonly auth = inject(AuthStore);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;

  protected readonly disputeId = signal<string>('');
  protected readonly dispute = signal<DisputeDetail | null>(null);
  protected readonly messages = signal<DisputeMessage[]>([]);
  protected readonly typingUsers = signal<string[]>([]);
  protected readonly sending = signal(false);
  protected readonly disputeStatus = signal('OPEN');

  protected messageText = '';

  private messageSub?: StompSubscription;
  private typingSub?: StompSubscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private isUserScrolled = false;
  private scrollThreshold = 100; // pixels from bottom to consider "scrolled to bottom"

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('Missing dispute ID in route');
      return;
    }

    this.disputeId.set(id);

    try {
      // 1️⃣ Load dispute detail (includes message history)
      const detail = await firstValueFrom(this.disputeService.getDispute(id));

      this.dispute.set(detail);
      this.disputeStatus.set(detail.status);
      this.messages.set(detail.messages ?? []);

      // Scroll to bottom after messages are rendered
      setTimeout(() => this.scrollToBottom(), 100);

      // 2️⃣ Connect WebSocket
      await this.stomp.connect();

      // 3️⃣ Subscribe to messages
      this.messageSub = this.stomp.subscribe(`/topic/dispute.${id}`);
      this.stomp.on<DisputeMessage>(`/topic/dispute.${id}`)
        .subscribe(msg => {
          this.messages.update(m => [...m, msg]);

          // Only auto-scroll if user was already at bottom
          setTimeout(() => {
            if (this.isNearBottom()) {
              this.scrollToBottom();
            }
          }, 50);
        });

      // 4️⃣ Subscribe to typing events
      this.typingSub = this.stomp.subscribe(`/topic/dispute.${id}.typing`);
      this.stomp.on<{ userId: string; userName: string; typing: boolean }>(
        `/topic/dispute.${id}.typing`
      ).subscribe(event => {
        const currentUserId = this.getCurrentUserId();

        // Ignore own typing events
        if (event.userId === currentUserId) return;

        this.typingUsers.update(users => {
          if (event.typing) {
            // Add user if not already in list
            return users.includes(event.userName)
              ? users
              : [...users, event.userName];
          } else {
            // Remove user from list
            return users.filter(u => u !== event.userName);
          }
        });

        // Scroll to bottom to show typing indicator if user was at bottom
        setTimeout(() => {
          if (this.isNearBottom()) {
            this.scrollToBottom();
          }
        }, 50);
      });

    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }

  /**
   * Handle scroll events to detect if user has manually scrolled
   */
  protected onScroll(): void {
    this.isUserScrolled = !this.isNearBottom();
  }

  /**
   * Check if scroll position is near bottom
   */
  private isNearBottom(): boolean {
    const element = this.messagesContainer?.nativeElement;
    if (!element) return true;

    const threshold = this.scrollThreshold;
    const position = element.scrollTop + element.clientHeight;
    const height = element.scrollHeight;

    return position > height - threshold;
  }

  /**
   * Send a message via STOMP
   */
  protected sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || this.sending()) return;

    this.sending.set(true);

    try {
      // Publish message to WebSocket
      this.stomp.publish(
        `/app/dispute/${this.disputeId()}/message`,
        {
          content,
          internalOnly: false
        }
      );

      // Clear input
      this.messageText = '';

      // Stop typing indicator
      clearTimeout(this.typingTimeout);
      this.stomp.publish(
        `/app/dispute/${this.disputeId()}/typing`,
        { typing: false }
      );

      // Reset scroll state and scroll to bottom after sending
      setTimeout(() => {
        this.isUserScrolled = false;
        this.scrollToBottom();
      }, 50);

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Handle typing events
   */
  protected onTyping(): void {
    // Send typing started event
    this.stomp.publish(
      `/app/dispute/${this.disputeId()}/typing`,
      { typing: true }
    );

    // Clear existing timeout
    clearTimeout(this.typingTimeout);

    // Set timeout to send typing stopped event after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.stomp.publish(
        `/app/dispute/${this.disputeId()}/typing`,
        { typing: false }
      );
    }, 2000);
  }

  /**
   * Check if message belongs to current user
   * Messages from current user appear on the right (sent)
   * Messages from others appear on the left (received)
   */
  protected isOwnMessage(msg: DisputeMessage): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || !msg.senderId) return false;
    return String(msg.senderId) === String(currentUserId);
  }

  private static readonly STAFF_ROLES = new Set(['SYSTEM', 'SUPPORT', 'ADMIN', 'SUPERVISOR']);

  protected isStaffMessage(msg: DisputeMessage): boolean {
    return msg.messageType === 'SYSTEM'
      || DisputeChatComponent.STAFF_ROLES.has(msg.senderRole?.toUpperCase());
  }

  private getCurrentUserId(): string | undefined {
    return this.auth.user()?.userId;
  }

  protected formatXAF(amount: number, currency = 'XAF'): string {
    return new Intl.NumberFormat('fr-CM', { style: 'decimal' }).format(amount) + ' ' + currency;
  }

  /**
   * Scroll messages container to bottom
   */
  private scrollToBottom(): void {
    try {
      const anchor = this.scrollAnchor?.nativeElement;
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    } catch (error) {
      console.error('Failed to scroll to bottom:', error);
    }
  }

  /**
   * Clean up subscriptions on component destroy
   */
  ngOnDestroy(): void {
    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Send typing stopped event if component is destroyed while typing
    if (this.disputeId()) {
      try {
        this.stomp.publish(
          `/app/dispute/${this.disputeId()}/typing`,
          { typing: false }
        );
      } catch (error) {
        console.error('Failed to send typing stopped event:', error);
      }
    }

    // Unsubscribe from STOMP topics
    this.messageSub?.unsubscribe();
    this.typingSub?.unsubscribe();
  }
}
