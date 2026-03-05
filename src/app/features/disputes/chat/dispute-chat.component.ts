import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

import {
  DisputeService,
  DisputeResponse,
  DisputeMessage,
  DisputeStatusEvent,
} from '../dispute.service';
import { StompService } from '@core/websocket/stomp.service';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TimelineStep } from '@shared/models/model';

@Component({
  selector: 'app-dispute-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TimeAgoPipe, TitleCasePipe, TranslatePipe, AmountPipe],
  styles: [':host { display: block; height: 100vh; overflow: hidden; }'],
  template: `
    <div class="animate-fade flex flex-col h-screen bg-page md:flex-row">

      <div class="flex flex-col min-h-0 flex-1">

        <!-- Topbar -->
        <div class="bg-dark px-4 py-3 flex items-center gap-3 shrink-0 shadow-[0_2px_12px_rgba(15,23,42,.25)]">
          <a routerLink="/disputes"
             class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <div class="flex-1 min-w-0">
            @if (dispute()) {
              <h1 class="text-sm font-bold text-white truncate">
                {{ dispute()!.reference }}
              </h1>
              @if (typingUsers().length > 0) {
                <p class="text-xs text-blue-300 truncate">{{ typingUsers()[0] }} {{ 'disputes.chat.typingOne' | translate:{ name: '' } }}</p>
              } @else {
                <p class="text-xs text-white/60 truncate">
                  {{ dispute()!.buyerName }} &amp; {{ dispute()!.sellerName }}
                  @if (dispute()!.grossAmount) { · {{ dispute()!.grossAmount | amount }} }
                </p>
              }
            } @else {
              <h1 class="text-sm font-bold text-white">Litige</h1>
              <p class="text-xs text-white/50">{{ 'common.loading' | translate }}</p>
            }
          </div>
          <app-status-badge [status]="dispute()?.status ?? 'OPENED'" />
        </div>

        <!-- ═══════════════════ CONTEXTUAL BANNER ═══════════════════ -->

        <!-- AWAITING_ARBITRATION_PAYMENT -->
        @if (dispute()?.status === 'AWAITING_ARBITRATION_PAYMENT') {
          <div class="shrink-0 mx-3 mt-3 bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-400 overflow-hidden animate-fade">
            <div class="px-4 py-3.5">
              <div class="flex items-start gap-3 mb-3">
                <div class="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center bg-orange-50 text-lg">⚖️</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-900 m-0">{{ 'disputes.arbitration.title' | translate }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5">{{ 'disputes.arbitration.subtitle' | translate }}</p>
                </div>
              </div>

              <!-- Fee + countdown row -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-orange-50 rounded-xl px-3 py-2.5">
                  <p class="text-[10px] font-semibold text-orange-600 uppercase tracking-wide m-0">{{ 'disputes.arbitration.fee' | translate }}</p>
                  <p class="text-base font-extrabold text-slate-900 m-0">{{ dispute()!.arbitrationFee | amount }}</p>
                </div>
                <div class="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide m-0">{{ 'disputes.arbitration.deadline' | translate }}</p>
                  @if (deadlinePassed()) {
                    <p class="text-xs font-bold text-red-600 m-0">{{ 'disputes.arbitration.deadlinePassed' | translate }}</p>
                  } @else {
                    <p class="text-sm font-bold text-slate-900 m-0 font-mono">{{ countdown() }}</p>
                  }
                </div>
              </div>

              <!-- Party payment indicators -->
              <div class="flex gap-3 mb-3">
                <div class="flex items-center gap-1.5 text-xs"
                     [class.text-success]="dispute()!.buyerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.buyerArbitrationFeePaid">
                  <span class="text-base">{{ dispute()!.buyerArbitrationFeePaid ? '✓' : '✗' }}</span>
                  {{ 'disputes.arbitration.buyerPaid' | translate }}
                </div>
                <div class="flex items-center gap-1.5 text-xs"
                     [class.text-success]="dispute()!.sellerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.sellerArbitrationFeePaid">
                  <span class="text-base">{{ dispute()!.sellerArbitrationFeePaid ? '✓' : '✗' }}</span>
                  {{ 'disputes.arbitration.sellerPaid' | translate }}
                </div>
              </div>

              <!-- Warning box -->
              @if (!alreadyPaid() && !deadlinePassed()) {
                <div class="bg-amber-50 rounded-xl px-3 py-2 mb-3 border border-amber-200">
                  <p class="text-xs font-semibold text-amber-700 m-0 mb-1">⚠️ {{ 'disputes.arbitration.warning' | translate }}</p>
                  <p class="text-xs text-amber-600 m-0">• {{ 'disputes.arbitration.warningDefaultLose' | translate }}</p>
                  <p class="text-xs text-amber-600 m-0">• {{ 'disputes.arbitration.warningFundsReleased' | translate }}</p>
                </div>
              }

              <!-- Paid waiting state -->
              @if (alreadyPaid() && dispute()!.status === 'AWAITING_ARBITRATION_PAYMENT') {
                <div class="bg-success-lt rounded-xl px-3 py-2 mb-3 border border-green-200">
                  <p class="text-xs font-semibold text-success m-0">✓ {{ 'disputes.arbitration.paid' | translate }}</p>
                </div>
              }

              <!-- CTA button -->
              @if (!alreadyPaid() && !deadlinePassed()) {
                <button
                  (click)="payArbitrationFee()"
                  [disabled]="paying()"
                  class="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #F97316, #EA580C); box-shadow: 0 4px 16px rgba(249,115,22,.35)"
                >
                  @if (paying()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ 'disputes.arbitration.payingBtn' | translate }}
                  } @else {
                    ⚖️ {{ 'disputes.arbitration.payBtn' | translate }} — {{ dispute()!.arbitrationFee | amount }}
                  }
                </button>
              }
            </div>
          </div>
        }

        <!-- REFERRED_TO_ARBITRATION -->
        @if (dispute()?.status === 'REFERRED_TO_ARBITRATION') {
          <div class="shrink-0 mx-3 mt-3 bg-white rounded-2xl shadow-sm border-l-4 border-l-violet-500 overflow-hidden animate-fade">
            <div class="px-4 py-3.5">
              <div class="flex items-start gap-3 mb-2">
                <div class="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center bg-violet-50 text-lg">⚖️</div>
                <div class="flex-1">
                  <p class="text-sm font-bold text-slate-900 m-0">{{ 'disputes.arbitration.referredTitle' | translate }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5">{{ 'disputes.arbitration.referredBody' | translate }}</p>
                </div>
              </div>
              <div class="flex gap-4 mt-2">
                <div class="flex items-center gap-1.5 text-xs text-success">
                  <span class="text-base">✓</span>{{ 'disputes.arbitration.buyerPaid' | translate }}
                </div>
                <div class="flex items-center gap-1.5 text-xs text-success">
                  <span class="text-base">✓</span>{{ 'disputes.arbitration.sellerPaid' | translate }}
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-2 m-0">{{ 'disputes.arbitration.referredEmail' | translate }}</p>
            </div>
          </div>
        }

        <!-- TERMINAL outcome banner -->
        @if (isTerminal()) {
          <div class="shrink-0 mx-3 mt-3 rounded-2xl overflow-hidden animate-fade"
               [class]="terminalBannerClass()">
            <div class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">{{ terminalIcon() }}</span>
                <div>
                  <p class="text-sm font-bold m-0">{{ terminalTitle() | translate }}</p>
                  @if (dispute()!.refundedToBuyer) {
                    <p class="text-xs m-0 mt-0.5 opacity-80">{{ 'disputes.arbitration.refundedLabel' | translate }}: {{ dispute()!.refundedToBuyer | amount }}</p>
                  }
                  @if (dispute()!.releasedToSeller) {
                    <p class="text-xs m-0 mt-0.5 opacity-80">{{ 'disputes.arbitration.releasedLabel' | translate }}: {{ dispute()!.releasedToSeller | amount }}</p>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ═══════════════════ MESSAGES ═══════════════════ -->
        <div
          #messagesContainer
          class="flex-1 overflow-y-auto px-3 py-3 scroll-smooth"
          (scroll)="onScroll()"
        >
          <div class="flex flex-col gap-2.5 min-h-full">

            @for (msg of messages(); track msg.id) {

              @if (isStaffMessage(msg)) {
                <!-- System / Support / Admin — centred -->
                <div class="flex justify-center px-2">
                  <div class="max-w-[80%] flex flex-col items-center gap-1">
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
                    <div class="rounded-2xl px-4 py-2.5 text-center border"
                      [class.bg-amber-50]="msg.messageType === 'SYSTEM'"
                      [class.border-amber-200]="msg.messageType === 'SYSTEM'"
                      [class.bg-indigo-50]="msg.messageType !== 'SYSTEM'"
                      [class.border-indigo-200]="msg.messageType !== 'SYSTEM'"
                    >
                      <p class="text-sm italic break-words whitespace-pre-wrap m-0"
                        [class.text-amber-800]="msg.messageType === 'SYSTEM'"
                        [class.text-indigo-800]="msg.messageType !== 'SYSTEM'"
                      >{{ msg.content }}</p>
                      <p class="text-[10px] mt-1 opacity-60 m-0"
                        [class.text-amber-600]="msg.messageType === 'SYSTEM'"
                        [class.text-indigo-600]="msg.messageType !== 'SYSTEM'"
                      >{{ msg.createdAt | timeAgo }}</p>
                    </div>
                  </div>
                </div>

              } @else {
                <!-- User message — left / right -->
                <div class="flex w-full" [class.justify-end]="isOwnMessage(msg)">
                  <div class="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-[0_1px_4px_rgba(15,23,42,.08)]"
                    [class.bg-primary]="isOwnMessage(msg)"
                    [class.text-white]="isOwnMessage(msg)"
                    [class.rounded-br-md]="isOwnMessage(msg)"
                    [class.bg-white]="!isOwnMessage(msg)"
                    [class.rounded-bl-md]="!isOwnMessage(msg)"
                  >
                    @if (!isOwnMessage(msg)) {
                      <p class="text-xs font-bold text-primary mb-1 m-0">{{ msg.senderName }}</p>
                    }
                    <p class="text-sm break-words whitespace-pre-wrap m-0">{{ msg.content }}</p>
                    <p class="text-[10px] mt-1 text-right opacity-60 m-0">{{ msg.createdAt | timeAgo }}</p>
                  </div>
                </div>
              }
            }

            <div #scrollAnchor class="h-0"></div>
          </div>
        </div>

        <!-- ═══════════════════ INPUT ═══════════════════ -->
        @if (!isTerminal() && dispute()?.status !== 'REFERRED_TO_ARBITRATION') {
          <div class="bg-white border-t border-slate-100 px-3 py-2.5 flex gap-2 items-end shrink-0 shadow-[0_-2px_8px_rgba(15,23,42,.06)]">
            <textarea
              [(ngModel)]="messageText"
              (input)="onTyping()"
              (keydown.enter)="$event.preventDefault(); sendMessage()"
              [placeholder]="'disputes.chat.placeholder' | translate"
              rows="1"
              class="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-primary transition-colors max-h-28 overflow-y-auto"
            ></textarea>
            <button
              (click)="sendMessage()"
              [disabled]="!messageText.trim() || sending()"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style="background: var(--clr-primary)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        }

      </div><!-- end left column -->

      <!-- ═══════════════════════════════════════════════════════════
           RIGHT COLUMN — Details + Status timeline (desktop only)
           ══════════════════════════════════════════════════════════ -->
      <div class="hidden md:flex flex-col w-[340px] border-l border-slate-100 bg-white shrink-0 overflow-y-auto">

        <!-- Panel header -->
        <div class="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 m-0">{{ 'disputes.details.title' | translate }}</p>
        </div>

        @if (dispute()) {
          <div class="px-4 py-4 space-y-3">

            <!-- Reference -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.reference' | translate }}</p>
              <p class="text-sm font-bold text-slate-900 font-mono m-0">{{ dispute()!.reference }}</p>
            </div>

            <!-- Current status -->
            <div class="flex items-center gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0">{{ 'disputes.details.status' | translate }}</p>
              <app-status-badge [status]="dispute()!.status" />
            </div>

            <!-- Parties -->
            <div class="bg-slate-50 rounded-xl p-3 space-y-2.5">
              <!-- Buyer -->
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                  {{ dispute()!.buyerName?.[0]?.toUpperCase() ?? 'A' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 truncate m-0">{{ dispute()!.buyerName ?? '—' }}</p>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'disputes.details.buyer' | translate }}</p>
                </div>
                @if (isBuyer()) {
                  <span class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">{{ 'disputes.details.you' | translate }}</span>
                }
              </div>
              <!-- Seller -->
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 shrink-0">
                  {{ dispute()!.sellerName?.[0]?.toUpperCase() ?? 'V' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 truncate m-0">{{ dispute()!.sellerName ?? '—' }}</p>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'disputes.details.seller' | translate }}</p>
                </div>
                @if (!isBuyer()) {
                  <span class="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">{{ 'disputes.details.you' | translate }}</span>
                }
              </div>
            </div>

            <!-- Amounts -->
            <div class="flex gap-2">
              @if (dispute()!.grossAmount) {
                <div class="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.escrow' | translate }}</p>
                  <p class="text-sm font-bold text-slate-900 m-0">{{ dispute()!.grossAmount | amount }}</p>
                </div>
              }
              @if (dispute()!.claimedAmount) {
                <div class="flex-1 bg-red-50 rounded-xl px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-red-400 m-0 mb-0.5">{{ 'disputes.details.claimed' | translate }}</p>
                  <p class="text-sm font-bold text-red-700 m-0">{{ dispute()!.claimedAmount | amount }}</p>
                </div>
              }
            </div>

            <!-- Transaction ref -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.transaction' | translate }}</p>
              <p class="text-xs font-mono text-slate-600 m-0 break-all">{{ dispute()!.transactionRef }}</p>
            </div>

            <!-- Opened at -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.openedAt' | translate }}</p>
              <p class="text-xs text-slate-600 m-0">{{ dispute()!.createdAt | timeAgo }}</p>
            </div>

            <!-- Reason -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.reason' | translate }}</p>
              <p class="text-xs text-slate-700 m-0">{{ ('disputes.reasons.' + dispute()!.reason) | translate }}</p>
            </div>

          </div>
        } @else {
          <!-- Details skeleton -->
          <div class="px-4 py-4 space-y-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="skeleton-shimmer h-10 rounded-xl"></div>
            }
          </div>
        }

        <!-- ─── Status timeline ─────────────────────────────── -->
        <div class="border-t border-slate-100 mx-4 my-1"></div>

        <div class="px-4 py-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 m-0">{{ 'disputes.timeline.title' | translate }}</p>
        </div>

        <div class="px-4 pb-8">
          @for (step of statusTimeline(); track step.key; let isLast = $last) {
            <div class="relative flex gap-3 pb-4">

              <!-- Vertical connector (hidden on last item) -->
              @if (!isLast) {
                <div class="absolute left-[11px] top-6 bottom-0 w-0.5 rounded-full transition-colors"
                     [class.bg-primary]="step.state === 'completed'"
                     [class.bg-slate-200]="step.state !== 'completed'"></div>
              }

              <!-- Step dot -->
              <div class="w-6 h-6 rounded-full shrink-0 z-10 flex items-center justify-center text-[10px] font-bold transition-all"
                   [class.bg-primary]="step.state === 'current'"
                   [class.text-white]="step.state === 'current' || step.state === 'completed'"
                   [class.ring-4]="step.state === 'current'"
                   [class.ring-blue-100]="step.state === 'current'"
                   [class.bg-green-500]="step.state === 'completed'"
                   [class.bg-slate-100]="step.state === 'pending'"
                   [class.text-slate-400]="step.state === 'pending'">
                @if (step.state === 'completed') { ✓ }
                @else if (step.state === 'current') {
                  <span class="w-2 h-2 bg-white rounded-full block"></span>
                }
              </div>

              <!-- Step label -->
              <div class="flex-1 min-w-0 pt-0.5">
                <p class="text-xs m-0 leading-tight"
                   [class.font-bold]="step.state === 'current'"
                   [class.text-primary]="step.state === 'current'"
                   [class.font-medium]="step.state === 'completed'"
                   [class.text-green-600]="step.state === 'completed'"
                   [class.text-slate-400]="step.state === 'pending'">
                  {{ step.labelKey | translate }}
                </p>
                @if (step.state === 'current') {
                  <p class="text-[10px] text-slate-400 m-0 mt-0.5">{{ 'disputes.timeline.inProgress' | translate }}</p>
                }
              </div>

            </div>
          }
        </div>

      </div><!-- end right column -->

    </div>
  `,
})
export class DisputeChatComponent implements OnInit, OnDestroy {

  private readonly route          = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly stomp          = inject(StompService);
  private readonly auth           = inject(AuthStore);
  private readonly toast          = inject(ToastService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;

  protected readonly disputeId   = signal('');
  protected readonly dispute     = signal<DisputeResponse | null>(null);
  protected readonly messages    = signal<DisputeMessage[]>([]);
  protected readonly typingUsers = signal<string[]>([]);
  protected readonly sending     = signal(false);
  protected readonly paying      = signal(false);
  protected readonly countdown   = signal('');

  protected messageText = '';

  private messageSub?: StompSubscription;
  private statusSub?: StompSubscription;
  private typingSub?: StompSubscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private countdownInterval?: ReturnType<typeof setInterval>;
  private isNearBottomState = true;

  // ── Computed helpers ──────────────────────────────────────────

  protected readonly deadlinePassed = computed(() => {
    const d = this.dispute()?.submissionDeadline;
    if (!d) return false;
    return new Date(d).getTime() <= Date.now();
  });

  protected readonly alreadyPaid = computed(() => {
    const d = this.dispute();
    if (!d) return false;
    return this.isBuyer() ? d.buyerArbitrationFeePaid : d.sellerArbitrationFeePaid;
  });

  protected readonly isTerminal = computed(() => {
    const s = this.dispute()?.status;
    return s === 'RESOLVED_BUYER' || s === 'RESOLVED_SELLER'
        || s === 'RESOLVED_SPLIT' || s === 'CLOSED_NO_ACTION' || s === 'CANCELLED';
  });

  // ── Status timeline ───────────────────────────────────────────

  private readonly TIMELINE_STEPS = [
    { key: 'OPENED',                       labelKey: 'status.OPENED' },
    { key: 'UNDER_REVIEW',                 labelKey: 'status.UNDER_REVIEW' },
    { key: 'AWAITING',                     labelKey: 'disputes.timeline.awaitingResponse' },
    { key: 'AWAITING_ARBITRATION_PAYMENT', labelKey: 'status.AWAITING_ARBITRATION_PAYMENT' },
    { key: 'REFERRED_TO_ARBITRATION',      labelKey: 'status.REFERRED_TO_ARBITRATION' },
    { key: 'RESOLVED',                     labelKey: 'disputes.timeline.resolved' },
  ];

  private statusToIndex(status: string): number {
    switch (status) {
      case 'OPENED':                        return 0;
      case 'UNDER_REVIEW':                  return 1;
      case 'AWAITING_BUYER':
      case 'AWAITING_SELLER':               return 2;
      case 'AWAITING_ARBITRATION_PAYMENT':  return 3;
      case 'REFERRED_TO_ARBITRATION':       return 4;
      default:                              return 5;
    }
  }

  protected readonly statusTimeline = computed((): TimelineStep[] => {
    const d = this.dispute();
    const currentIdx = d ? this.statusToIndex(d.status) : 0;
    return this.TIMELINE_STEPS.map((step, idx) => ({
      key: step.key,
      labelKey: step.labelKey,
      state: idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending',
    }));
  });

  // ── Terminal banner helpers ───────────────────────────────────

  protected terminalBannerClass(): string {
    const d = this.dispute();
    if (!d) return '';
    const rt = d.resolutionType;
    const iWon = (rt === 'DEFAULT_WIN_BUYER' && this.isBuyer())
              || (rt === 'DEFAULT_WIN_SELLER' && !this.isBuyer())
              || (rt === 'FULL_REFUND_BUYER' && this.isBuyer())
              || (rt === 'PARTIAL_REFUND_BUYER' && this.isBuyer())
              || (rt === 'RELEASE_TO_SELLER' && !this.isBuyer());
    if (d.status === 'CLOSED_NO_ACTION') return 'bg-slate-100 text-slate-700 border border-slate-200';
    if (iWon) return 'bg-success-lt text-success border border-green-200';
    return 'bg-red-50 text-error border border-red-200';
  }

  protected terminalIcon(): string {
    const d = this.dispute();
    if (!d) return '';
    if (d.status === 'CLOSED_NO_ACTION') return '📁';
    if (d.status === 'RESOLVED_SPLIT') return '⚖️';
    const iWon = (d.resolutionType === 'DEFAULT_WIN_BUYER' && this.isBuyer())
              || (d.resolutionType === 'DEFAULT_WIN_SELLER' && !this.isBuyer())
              || (['FULL_REFUND_BUYER', 'PARTIAL_REFUND_BUYER'].includes(d.resolutionType ?? '') && this.isBuyer())
              || (d.resolutionType === 'RELEASE_TO_SELLER' && !this.isBuyer());
    return iWon ? '🎉' : '😔';
  }

  protected terminalTitle(): string {
    const d = this.dispute();
    if (!d) return '';
    const rt = d.resolutionType;
    if (d.status === 'CLOSED_NO_ACTION') return 'disputes.arbitration.closedNoAction';
    if (d.status === 'RESOLVED_SPLIT') return 'disputes.arbitration.resolvedSplit';
    if (rt === 'DEFAULT_WIN_BUYER') return this.isBuyer() ? 'disputes.arbitration.winByDefault' : 'disputes.arbitration.loseByDefault';
    if (rt === 'DEFAULT_WIN_SELLER') return this.isBuyer() ? 'disputes.arbitration.loseByDefault' : 'disputes.arbitration.winByDefault';
    if (d.status === 'RESOLVED_BUYER') return 'disputes.arbitration.resolvedBuyer';
    if (d.status === 'RESOLVED_SELLER') return 'disputes.arbitration.resolvedSeller';
    return 'disputes.arbitration.resolvedBuyer';
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.disputeId.set(id);

    try {
      const detail = await firstValueFrom(this.disputeService.getDispute(id));
      this.dispute.set(detail);
      this.messages.set(detail.messages ?? []);

      setTimeout(() => this.scrollToBottom(), 100);
      this.startCountdown();

      await this.stomp.connect();

      this.messageSub = this.stomp.subscribe(`/topic/dispute.${id}`);
      this.stomp.on<DisputeMessage>(`/topic/dispute.${id}`)
        .subscribe(msg => {
          this.messages.update(m => [...m, msg]);
          setTimeout(() => { if (this.isNearBottomState) this.scrollToBottom(); }, 50);
        });

      this.statusSub = this.stomp.subscribe(`/topic/dispute.${id}.status`);
      this.stomp.on<DisputeStatusEvent>(`/topic/dispute.${id}.status`)
        .subscribe(() => {
          this.disputeService.getDispute(id).subscribe(d => {
            this.dispute.set(d);
            this.startCountdown();
          });
        });

      this.typingSub = this.stomp.subscribe(`/topic/dispute.${id}.typing`);
      this.stomp.on<{ userId: string; userName: string; typing: boolean }>(`/topic/dispute.${id}.typing`)
        .subscribe(event => {
          if (event.userId === this.auth.user()?.userId) return;
          this.typingUsers.update(users =>
            event.typing
              ? (users.includes(event.userName) ? users : [...users, event.userName])
              : users.filter(u => u !== event.userName)
          );
        });

    } catch {
      // handled by error interceptor toast
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimeout);
    clearInterval(this.countdownInterval);
    if (this.disputeId()) {
      try { this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false }); } catch { /* no-op */ }
    }
    this.messageSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.typingSub?.unsubscribe();
  }

  // ── Arbitration ───────────────────────────────────────────────

  protected payArbitrationFee(): void {
    const id = this.disputeId();
    if (!id || this.paying()) return;
    this.paying.set(true);

    this.disputeService.submitArbitrationFee(id).subscribe({
      next: (updated) => {
        this.dispute.set(updated);
        this.paying.set(false);
        if (updated.status === 'REFERRED_TO_ARBITRATION') {
          this.toast.success('Dossier transmis au tribunal arbitral !');
        }
      },
      error: () => this.paying.set(false),
    });
  }

  // ── Countdown timer ───────────────────────────────────────────

  private startCountdown(): void {
    clearInterval(this.countdownInterval);
    const d = this.dispute();
    if (!d?.submissionDeadline || d.status !== 'AWAITING_ARBITRATION_PAYMENT') return;

    const tick = () => {
      const ms = new Date(d.submissionDeadline!).getTime() - Date.now();
      if (ms <= 0) {
        this.countdown.set('00j 00h 00m 00s');
        clearInterval(this.countdownInterval);
        return;
      }
      const days  = Math.floor(ms / 86_400_000);
      const hours = Math.floor((ms % 86_400_000) / 3_600_000);
      const mins  = Math.floor((ms % 3_600_000) / 60_000);
      const secs  = Math.floor((ms % 60_000) / 1_000);
      this.countdown.set(
        `${String(days).padStart(2,'0')}j ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`
      );
    };
    tick();
    this.countdownInterval = setInterval(tick, 1_000);
  }

  // ── Messaging ─────────────────────────────────────────────────

  protected sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    try {
      this.stomp.publish(`/app/dispute/${this.disputeId()}/message`, { content, internalOnly: false });
      this.messageText = '';
      clearTimeout(this.typingTimeout);
      this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
      setTimeout(() => { this.isNearBottomState = false; this.scrollToBottom(); }, 50);
    } finally {
      this.sending.set(false);
    }
  }

  protected onTyping(): void {
    this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: true });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
    }, 2000);
  }

  protected onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    this.isNearBottomState = (el.scrollTop + el.clientHeight) > (el.scrollHeight - 100);
  }

  // ── Helpers ───────────────────────────────────────────────────

  protected isBuyer(): boolean {
    const d = this.dispute();
    const uid = this.auth.user()?.userId;
    if (!d || !uid) return false;
    return d.initiatorRole === 'BUYER'
      ? uid === d.initiatorId
      : uid !== d.initiatorId;
  }

  protected isOwnMessage(msg: DisputeMessage): boolean {
    const uid = this.auth.user()?.userId;
    return !!uid && String(msg.senderId) === String(uid);
  }

  private static readonly STAFF_ROLES = new Set(['SYSTEM', 'SUPPORT', 'ADMIN', 'SUPERVISOR']);

  protected isStaffMessage(msg: DisputeMessage): boolean {
    return msg.messageType === 'SYSTEM'
        || DisputeChatComponent.STAFF_ROLES.has(msg.senderRole?.toUpperCase());
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch { /* no-op */ }
  }
}
