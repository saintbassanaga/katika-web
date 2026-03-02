import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

import { DisputeService } from '../dispute.service';
import {
  DisputeDetail,
  DisputeEvidence,
  DisputeMessage,
  EvidenceType,
  ResolutionType,
} from '@app/models';
import { StompService } from '@core/websocket/stomp.service';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';

const EVIDENCE_TYPES: { value: EvidenceType; labelKey: string; icon: string }[] = [
  { value: 'SCREENSHOT', labelKey: 'disputes.evidence.types.SCREENSHOT', icon: '🖥️' },
  { value: 'IMAGE',      labelKey: 'disputes.evidence.types.IMAGE',      icon: '📷' },
  { value: 'DOCUMENT',   labelKey: 'disputes.evidence.types.DOCUMENT',   icon: '📄' },
  { value: 'RECEIPT',    labelKey: 'disputes.evidence.types.RECEIPT',    icon: '🧾' },
  { value: 'VIDEO',      labelKey: 'disputes.evidence.types.VIDEO',      icon: '🎥' },
  { value: 'OTHER',      labelKey: 'disputes.evidence.types.OTHER',      icon: '📎' },
];

const RESOLUTION_OPTIONS: { value: ResolutionType; labelKey: string; descKey: string; color: string }[] = [
  { value: 'FULL_REFUND_BUYER',    labelKey: 'disputes.resolve.fullRefundBuyer',    descKey: 'disputes.resolve.fullRefundBuyerDesc',    color: 'var(--clr-primary)' },
  { value: 'RELEASE_TO_SELLER',    labelKey: 'disputes.resolve.releaseToSeller',    descKey: 'disputes.resolve.releaseToSellerDesc',    color: 'var(--clr-success)' },
  { value: 'PARTIAL_REFUND_BUYER', labelKey: 'disputes.resolve.partialRefundBuyer', descKey: 'disputes.resolve.partialRefundBuyerDesc', color: 'var(--clr-gold)' },
  { value: 'SPLIT_50_50',          labelKey: 'disputes.resolve.split5050',          descKey: 'disputes.resolve.split5050Desc',          color: '#8B5CF6' },
  { value: 'NO_ACTION',            labelKey: 'disputes.resolve.noAction',           descKey: 'disputes.resolve.noActionDesc',           color: 'var(--clr-muted)' },
];

const STAFF_ROLES = new Set(['SYSTEM', 'SUPPORT', 'ADMIN', 'SUPERVISOR']);
const ACTIVE_STATUSES = new Set(['OPENED', 'IN_PROGRESS', 'DISPUTED', 'OPEN']);

@Component({
  selector: 'app-dispute-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TimeAgoPipe, TitleCasePipe, TranslatePipe, AmountPipe],
  template: `
    <div class="flex flex-col h-screen bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <a routerLink="/disputes" class="text-gray-500 hover:text-gray-700 transition-colors shrink-0">
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
              <p class="text-xs text-blue-500 truncate">{{ 'disputes.chat.typing' | translate:{ name: typingUsers()[0] } }}</p>
            } @else {
              <p class="text-xs text-gray-500 truncate">
                {{ dispute()!.description || dispute()!.transactionRef }}
                · {{ dispute()!.grossAmount | amount }}
              </p>
            }
          } @else {
            <h1 class="text-sm font-bold text-gray-900">{{ 'disputes.chat.title' | translate }}</h1>
            <p class="text-xs text-gray-400">{{ 'common.loading' | translate }}</p>
          }
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <app-status-badge [status]="disputeStatus()" />
          <!-- Resolve button — staff only, only for active disputes -->
          @if (isStaff() && isActive()) {
            <button
              (click)="showResolvePanel.set(true)"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors"
              style="border-color: var(--clr-error); color: var(--clr-error)"
            >
              {{ 'disputes.resolve.button' | translate }}
            </button>
          }
        </div>
      </div>

      <!-- Messages Container -->
      <div
        #messagesContainer
        class="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
        (scroll)="onScroll()"
      >
        <div class="flex flex-col space-y-3 min-h-full">

          @for (msg of messages(); track msg.id) {

            @if (isStaffMessage(msg)) {
              <!-- System / Support / Admin message — centred -->
              <div class="flex justify-center px-2">
                <div class="max-w-[75%] flex flex-col items-center gap-1">
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
                  <div class="rounded-2xl px-4 py-2 text-center border"
                    [class.bg-amber-50]="msg.messageType === 'SYSTEM'"
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
              <!-- User message — left / right -->
              <div class="flex w-full" [class.justify-end]="isOwnMessage(msg)">
                <div
                  class="max-w-[80%] rounded-2xl px-4 py-2.5"
                  [class.bg-blue-600]="isOwnMessage(msg)"
                  [class.text-white]="isOwnMessage(msg)"
                  [class.bg-white]="!isOwnMessage(msg)"
                  [class.shadow-sm]="!isOwnMessage(msg)"
                >
                  @if (!isOwnMessage(msg)) {
                    <p class="text-xs font-semibold text-blue-600 mb-1">{{ msg.senderName }}</p>
                  }
                  <p class="text-sm break-words whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-xs mt-1 opacity-70 text-right">{{ msg.createdAt | timeAgo }}</p>
                </div>
              </div>
            }

          }

          <!-- Evidence cards -->
          @for (ev of evidences(); track ev.id) {
            <div class="flex justify-center px-2">
              <div class="max-w-[80%] w-full bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 border"
                   [style.border-color]="ev.rejected ? 'var(--clr-error)' : ev.verified ? 'var(--clr-success)' : 'var(--clr-border)'">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                     style="background: var(--clr-primary-lt)">
                  {{ evidenceIcon(ev.evidenceType) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold truncate" style="color: var(--clr-text)">
                    {{ ev.originalFileName }}
                  </p>
                  @if (ev.description) {
                    <p class="text-xs truncate" style="color: var(--clr-muted)">{{ ev.description }}</p>
                  }
                  @if (ev.rejected && ev.rejectionReason) {
                    <p class="text-[10px] truncate" style="color: var(--clr-error)">
                      {{ 'disputes.evidence.rejectedPrefix' | translate }} {{ ev.rejectionReason }}
                    </p>
                  }
                  <p class="text-[10px]" style="color: var(--clr-muted)">
                    {{ ev.uploaderName }} · {{ ev.createdAt | timeAgo }}
                  </p>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                    {{ 'disputes.evidence.types.' + ev.evidenceType | translate }}
                  </span>
                  @if (ev.verified) {
                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style="background: var(--clr-success-lt); color: var(--clr-success)">
                      {{ 'disputes.evidence.verified' | translate }}
                    </span>
                  } @else if (ev.rejected) {
                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                          style="background: var(--clr-error-lt); color: var(--clr-error)">
                      {{ 'disputes.evidence.rejected' | translate }}
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          <div #scrollAnchor class="h-0"></div>
        </div>
      </div>

      <!-- Evidence upload panel (shown above input when attachment button clicked) -->
      @if (showEvidencePanel()) {
        <div class="bg-white border-t border-slate-200 px-4 pt-3 pb-2">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold" style="color: var(--clr-text)">
              {{ 'disputes.evidence.panelTitle' | translate }}
            </p>
            <button (click)="closeEvidencePanel()" class="text-slate-400 hover:text-slate-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Evidence type chips -->
          <div class="flex gap-1.5 flex-wrap mb-2">
            @for (et of evidenceTypes; track et.value) {
              <button
                type="button"
                (click)="selectedEvidenceType.set(et.value)"
                class="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                [class.border-transparent]="selectedEvidenceType() === et.value"
                [class.text-white]="selectedEvidenceType() === et.value"
                [style.background]="selectedEvidenceType() === et.value ? 'var(--clr-primary)' : 'transparent'"
                [style.border-color]="selectedEvidenceType() === et.value ? 'var(--clr-primary)' : 'var(--clr-border)'"
                [style.color]="selectedEvidenceType() === et.value ? '#fff' : 'var(--clr-muted)'"
              >
                {{ et.icon }} {{ et.labelKey | translate }}
              </button>
            }
          </div>

          <!-- Description input -->
          <input
            type="text"
            [(ngModel)]="evidenceDescription"
            [placeholder]="'disputes.evidence.descPh' | translate"
            class="w-full px-3 py-2 rounded-xl text-xs border outline-none mb-2"
            style="border-color: var(--clr-border); color: var(--clr-text); background: var(--clr-surface, #F8FAFC)"
          />

          <!-- File input + submit row -->
          <div class="flex items-center gap-2">
            <label class="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-xs transition-colors hover:bg-slate-50"
                   style="border-color: var(--clr-border); color: var(--clr-muted)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="truncate">{{ evidenceFile() ? evidenceFile()!.name : ('disputes.evidence.filePh' | translate) }}</span>
              <input type="file" class="sr-only" accept="image/*,.pdf,.txt" (change)="onFileSelected($event)" />
            </label>
            <button
              (click)="submitEvidence()"
              [disabled]="!evidenceFile() || uploadingEvidence()"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity disabled:opacity-40"
              style="background: var(--clr-primary)"
            >
              @if (uploadingEvidence()) {
                <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
              } @else {
                {{ 'disputes.evidence.upload' | translate }}
              }
            </button>
          </div>
        </div>
      }

      <!-- Input bar -->
      <div class="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-end sticky bottom-0 shadow-lg">

        <!-- Attachment button -->
        <button
          type="button"
          (click)="toggleEvidencePanel()"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 border"
          [style.border-color]="showEvidencePanel() ? 'var(--clr-primary)' : 'var(--clr-border)'"
          [style.color]="showEvidencePanel() ? 'var(--clr-primary)' : 'var(--clr-muted)'"
          [style.background]="showEvidencePanel() ? 'var(--clr-primary-lt)' : 'transparent'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>

        <textarea
          [(ngModel)]="messageText"
          (input)="onTyping()"
          (keydown.enter)="$event.preventDefault(); sendMessage()"
          [placeholder]="'disputes.chat.messagePh' | translate"
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

      <!-- Resolve dispute overlay (staff only) -->
      @if (showResolvePanel()) {
        <div class="fixed inset-0 z-50 flex items-end" style="background: rgba(15,23,42,.45)"
             (click)="showResolvePanel.set(false)">
          <div class="w-full bg-white rounded-t-3xl px-5 pt-5 pb-8 max-h-[85vh] overflow-y-auto"
               (click)="$event.stopPropagation()">

            <!-- Handle -->
            <div class="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-4"></div>

            <h2 class="text-base font-bold mb-1" style="color: var(--clr-text)">
              {{ 'disputes.resolve.title' | translate }}
            </h2>
            <p class="text-xs mb-4" style="color: var(--clr-muted)">
              {{ 'disputes.resolve.subtitle' | translate }}
            </p>

            <div class="space-y-2">
              @for (opt of resolutionOptions; track opt.value) {
                <button
                  type="button"
                  (click)="resolve(opt.value)"
                  [disabled]="resolving()"
                  class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all
                         hover:opacity-90 disabled:opacity-40"
                  [style.border-color]="opt.color"
                >
                  <div class="w-2 h-2 rounded-full shrink-0" [style.background]="opt.color"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold" [style.color]="opt.color">
                      {{ opt.labelKey | translate }}
                    </p>
                    <p class="text-xs" style="color: var(--clr-muted)">
                      {{ opt.descKey | translate }}
                    </p>
                  </div>
                  @if (resolving()) {
                    <span class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0"
                          [style.border-color]="opt.color"></span>
                  }
                </button>
              }
            </div>

            <button (click)="showResolvePanel.set(false)"
                    class="mt-4 w-full py-3 rounded-2xl text-sm font-medium"
                    style="border: 1.5px solid var(--clr-border); color: var(--clr-muted)">
              {{ 'common.cancel' | translate }}
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [':host { display: block; height: 100vh; overflow: hidden; }'],
})
export class DisputeChatComponent implements OnInit, OnDestroy {

  private readonly route           = inject(ActivatedRoute);
  private readonly disputeService  = inject(DisputeService);
  private readonly stomp           = inject(StompService);
  private readonly auth            = inject(AuthStore);
  private readonly toast           = inject(ToastService);
  private readonly translate       = inject(TranslateService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor')      scrollAnchor!: ElementRef<HTMLElement>;

  protected readonly disputeId      = signal<string>('');
  protected readonly dispute        = signal<DisputeDetail | null>(null);
  protected readonly messages       = signal<DisputeMessage[]>([]);
  protected readonly evidences      = signal<DisputeEvidence[]>([]);
  protected readonly typingUsers    = signal<string[]>([]);
  protected readonly sending        = signal(false);
  protected readonly disputeStatus  = signal('OPEN');

  // Evidence upload
  protected readonly showEvidencePanel    = signal(false);
  protected readonly selectedEvidenceType = signal<EvidenceType>('SCREENSHOT');
  protected readonly evidenceFile         = signal<File | null>(null);
  protected readonly uploadingEvidence    = signal(false);
  protected evidenceDescription = '';

  // Staff resolve
  protected readonly showResolvePanel = signal(false);
  protected readonly resolving        = signal(false);

  protected messageText = '';

  protected readonly evidenceTypes    = EVIDENCE_TYPES;
  protected readonly resolutionOptions = RESOLUTION_OPTIONS;

  private messageSub?: StompSubscription;
  private typingSub?: StompSubscription;
  private statusSub?: StompSubscription;
  private evidenceSub?: StompSubscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private readonly scrollThreshold = 100;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.disputeId.set(id);

    try {
      const detail = await firstValueFrom(this.disputeService.getDispute(id));
      this.dispute.set(detail);
      this.disputeStatus.set(detail.status);
      this.messages.set(detail.messages ?? []);
      this.evidences.set(detail.evidences ?? []);
      setTimeout(() => this.scrollToBottom(), 100);

      await this.stomp.connect();

      // Messages
      this.messageSub = this.stomp.subscribe(`/topic/dispute.${id}`);
      this.stomp.on<DisputeMessage>(`/topic/dispute.${id}`).subscribe(msg => {
        this.messages.update(m => [...m, msg]);
        setTimeout(() => { if (this.isNearBottom()) this.scrollToBottom(); }, 50);
      });

      // Typing
      this.typingSub = this.stomp.subscribe(`/topic/dispute.${id}.typing`);
      this.stomp.on<{ userId: string; userName: string; typing: boolean }>(
        `/topic/dispute.${id}.typing`,
      ).subscribe(event => {
        if (event.userId === this.getCurrentUserId()) return;
        this.typingUsers.update(users =>
          event.typing
            ? (users.includes(event.userName) ? users : [...users, event.userName])
            : users.filter(u => u !== event.userName),
        );
        setTimeout(() => { if (this.isNearBottom()) this.scrollToBottom(); }, 50);
      });

      // Status updates (DISPUTE_RESOLVED broadcast)
      this.statusSub = this.stomp.subscribe(`/topic/dispute.${id}.status`);
      this.stomp.on<{ type: string; message: string }>(`/topic/dispute.${id}.status`)
        .subscribe(event => {
          if (event.type === 'DISPUTE_RESOLVED') {
            this.disputeStatus.set('RESOLVED');
            this.dispute.update(d => d ? { ...d, status: 'RESOLVED' } : d);
            this.showResolvePanel.set(false);
            this.toast.success(event.message);
          }
        });

      // Evidence updates
      this.evidenceSub = this.stomp.subscribe(`/topic/dispute.${id}.evidence`);
      this.stomp.on<DisputeEvidence>(`/topic/dispute.${id}.evidence`).subscribe(ev => {
        this.evidences.update(list => [...list, ev]);
        setTimeout(() => { if (this.isNearBottom()) this.scrollToBottom(); }, 50);
      });

    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }

  // ── Staff helpers ─────────────────────────────────────────────────────────

  protected isStaff(): boolean {
    const role = this.auth.user()?.role;
    return !!role && STAFF_ROLES.has(role);
  }

  protected isActive(): boolean {
    return ACTIVE_STATUSES.has(this.disputeStatus());
  }

  protected resolve(resolutionType: ResolutionType): void {
    if (this.resolving()) return;
    this.resolving.set(true);
    this.disputeService.resolveDispute(this.disputeId(), resolutionType).subscribe({
      next: (updated) => {
        this.disputeStatus.set(updated.status);
        this.dispute.update(d => d ? { ...d, status: updated.status, resolutionType: updated.resolutionType } : d);
        this.showResolvePanel.set(false);
        this.resolving.set(false);
        this.toast.success(this.translate.instant('disputes.resolve.successToast'));
      },
      error: () => this.resolving.set(false),
    });
  }

  // ── Evidence helpers ──────────────────────────────────────────────────────

  protected toggleEvidencePanel(): void {
    this.showEvidencePanel.update(v => !v);
  }

  protected closeEvidencePanel(): void {
    this.showEvidencePanel.set(false);
    this.evidenceFile.set(null);
    this.evidenceDescription = '';
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.evidenceFile.set(file);
  }

  protected submitEvidence(): void {
    const file = this.evidenceFile();
    if (!file || this.uploadingEvidence()) return;
    this.uploadingEvidence.set(true);
    this.disputeService.uploadEvidence(
      this.disputeId(),
      file,
      this.selectedEvidenceType(),
      this.evidenceDescription,
    ).subscribe({
      next: () => {
        this.closeEvidencePanel();
        this.uploadingEvidence.set(false);
        this.toast.success(this.translate.instant('disputes.evidence.successToast'));
      },
      error: () => {
        this.uploadingEvidence.set(false);
        this.toast.error(this.translate.instant('disputes.evidence.errorToast'));
      },
    });
  }

  protected evidenceIcon(type: string): string {
    return EVIDENCE_TYPES.find(e => e.value === type)?.icon ?? '📎';
  }

  // ── Scroll ────────────────────────────────────────────────────────────────

  protected onScroll(): void {
    // track scroll state (unused beyond isNearBottom check)
  }

  private isNearBottom(): boolean {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return true;
    return el.scrollTop + el.clientHeight > el.scrollHeight - this.scrollThreshold;
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch { /* ignore */ }
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  protected sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    try {
      this.stomp.publish(`/app/dispute/${this.disputeId()}/message`, { content, internalOnly: false });
      this.messageText = '';
      clearTimeout(this.typingTimeout);
      this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
      setTimeout(() => { this.scrollToBottom(); }, 50);
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

  protected isOwnMessage(msg: DisputeMessage): boolean {
    const uid = this.getCurrentUserId();
    return !!uid && String(msg.senderId) === String(uid);
  }

  protected isStaffMessage(msg: DisputeMessage): boolean {
    return msg.messageType === 'SYSTEM' || STAFF_ROLES.has(msg.senderRole?.toUpperCase());
  }

  private getCurrentUserId(): string | undefined {
    return this.auth.user()?.userId;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    clearTimeout(this.typingTimeout);
    if (this.disputeId()) {
      try {
        this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
      } catch { /* ignore */ }
    }
    this.messageSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.evidenceSub?.unsubscribe();
  }
}
