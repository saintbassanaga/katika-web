import { Component, inject, signal, OnInit, OnDestroy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { StompSubscription } from '@stomp/stompjs';
import { AdminService } from '../admin.service';
import { DisputeResponse, ResolutionType } from '@features/disputes/dispute.service';
import { DisputeMessage } from '@shared/models/model';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { StompService } from '@core/websocket/stomp.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TuiIcon } from '@taiga-ui/core';

const RESOLUTION_TYPES: { value: ResolutionType; labelKey: string }[] = [
  { value: 'FULL_REFUND_BUYER',    labelKey: 'admin.dispute.resolutionTypes.FULL_REFUND_BUYER' },
  { value: 'RELEASE_TO_SELLER',    labelKey: 'admin.dispute.resolutionTypes.RELEASE_TO_SELLER' },
  { value: 'PARTIAL_REFUND_BUYER', labelKey: 'admin.dispute.resolutionTypes.PARTIAL_REFUND_BUYER' },
  { value: 'SPLIT_50_50',          labelKey: 'admin.dispute.resolutionTypes.SPLIT_50_50' },
  { value: 'NO_ACTION',            labelKey: 'admin.dispute.resolutionTypes.NO_ACTION' },
];

const TERMINAL = new Set(['RESOLVED_BUYER','RESOLVED_SELLER','RESOLVED_SPLIT','CLOSED_NO_ACTION','CANCELLED']);

@Component({
  selector: 'app-admin-dispute-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, TimeAgoPipe, AmountPipe, DatePipe, TranslatePipe, TuiIcon],
  styles: [':host { display: block; height: 100%; overflow-y: auto; }'],
  template: `
    <div class="animate-fade flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/admin/disputes"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <tui-icon icon="@tui.arrow-left" class="w-5 h-5" />
        </a>
        <div class="flex-1 min-w-0">
          @if (dispute()) {
            <h1 class="text-sm font-bold text-white m-0 truncate">{{ dispute()!.reference }}</h1>
            <p class="text-xs text-white/50 m-0">{{ dispute()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
          } @else {
            <h1 class="text-sm font-bold text-white m-0">{{ 'admin.dispute.title' | translate }}</h1>
          }
        </div>
        @if (dispute()) {
          <app-status-badge [status]="dispute()!.status" />
        }
      </div>

      @if (loading()) {
        <div class="p-4 space-y-3 max-w-2xl mx-auto w-full">
          @for (i of [1,2,3]; track i) {
            <div class="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <div class="skeleton-shimmer h-3 w-1/3 rounded"></div>
              <div class="skeleton-shimmer h-5 w-2/3 rounded"></div>
              <div class="skeleton-shimmer h-3 w-1/2 rounded"></div>
            </div>
          }
        </div>

      } @else if (dispute()) {

        <div class="flex-1 px-4 md:px-8 py-4 pb-24 md:pb-8 max-w-2xl mx-auto w-full space-y-3">

          <!-- ── Parties card ── -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.parties' | translate }}</p>
            <div class="space-y-3">
              <!-- Buyer -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                     style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                  {{ dispute()!.buyerName?.[0] ?? 'B' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900 m-0">{{ dispute()!.buyerName ?? '—' }}</p>
                  <p class="text-xs text-slate-400 m-0">{{ 'admin.dispute.buyer' | translate }}</p>
                </div>
              </div>
              <!-- Seller -->
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                     style="background: var(--clr-success-lt); color: var(--clr-success)">
                  {{ dispute()!.sellerName?.[0] ?? 'V' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900 m-0">{{ dispute()!.sellerName ?? '—' }}</p>
                  <p class="text-xs text-slate-400 m-0">{{ 'admin.dispute.seller' | translate }}</p>
                </div>
              </div>
              <!-- Amount + ref -->
              <div class="border-t border-slate-100 pt-2.5 grid grid-cols-2 gap-2">
                <div>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.amount' | translate }}</p>
                  <p class="text-sm font-bold text-slate-900 m-0">{{ (dispute()!.grossAmount ?? 0) | amount }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.transaction' | translate }}</p>
                  <a [routerLink]="['/escrow', dispute()!.transactionId]"
                     class="text-xs font-semibold text-primary no-underline hover:underline truncate block">
                    {{ dispute()!.transactionRef }}
                  </a>
                </div>
                @if (dispute()!.claimedAmount) {
                  <div>
                    <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.claimedAmount' | translate }}</p>
                    <p class="text-sm font-bold text-error m-0">{{ dispute()!.claimedAmount | amount }}</p>
                  </div>
                }
              </div>
              <!-- Description -->
              @if (dispute()!.description) {
                <div class="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p class="text-[10px] text-slate-400 m-0 mb-1">{{ 'admin.dispute.description' | translate }}</p>
                  <p class="text-sm text-slate-700 m-0">{{ dispute()!.description }}</p>
                </div>
              }
            </div>
          </div>

          <!-- ── Arbitration info card (when relevant) ── -->
          @if (dispute()!.status === 'AWAITING_ARBITRATION_PAYMENT' || dispute()!.status === 'REFERRED_TO_ARBITRATION') {
            <div class="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-l-orange-400">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.arbitrationSection' | translate }}</p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.arbitrationFee' | translate }}</p>
                  <p class="text-sm font-bold text-slate-900 m-0">{{ dispute()!.arbitrationFee | amount }}</p>
                </div>
                <div>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.submissionDeadline' | translate }}</p>
                  <p class="text-sm font-bold text-slate-900 m-0">{{ dispute()!.submissionDeadline | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div class="flex items-center gap-1.5 text-sm"
                     [class.text-success]="dispute()!.buyerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.buyerArbitrationFeePaid">
                  @if (dispute()!.buyerArbitrationFeePaid) {
                    <tui-icon icon="@tui.check" class="w-4 h-4" />
                  } @else {
                    <tui-icon icon="@tui.x" class="w-4 h-4" />
                  }
                  {{ 'admin.dispute.buyerFeePaid' | translate }}
                </div>
                <div class="flex items-center gap-1.5 text-sm"
                     [class.text-success]="dispute()!.sellerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.sellerArbitrationFeePaid">
                  @if (dispute()!.sellerArbitrationFeePaid) {
                    <tui-icon icon="@tui.check" class="w-4 h-4" />
                  } @else {
                    <tui-icon icon="@tui.x" class="w-4 h-4" />
                  }
                  {{ 'admin.dispute.sellerFeePaid' | translate }}
                </div>
              </div>
            </div>
          }

          <!-- ── Status update (SUPPORT, when UNDER_REVIEW) ── -->
          @if (!isAdmin() && dispute()!.status === 'UNDER_REVIEW') {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.statusUpdate' | translate }}</p>
              <div class="grid grid-cols-2 gap-2 mb-3">
                <button
                  (click)="updateStatus('AWAITING_BUYER')"
                  [disabled]="actionLoading()"
                  class="py-2.5 rounded-xl font-semibold text-sm border-2 border-amber-300 text-amber-700 bg-amber-50 transition-all disabled:opacity-40 hover:bg-amber-100 flex items-center justify-center gap-1.5"
                >
                  <tui-icon icon="@tui.hourglass" class="w-6 h-6" /> {{ 'admin.dispute.awaitingBuyer' | translate }}
                </button>
                <button
                  (click)="updateStatus('AWAITING_SELLER')"
                  [disabled]="actionLoading()"
                  class="py-2.5 rounded-xl font-semibold text-sm border-2 border-amber-300 text-amber-700 bg-amber-50 transition-all disabled:opacity-40 hover:bg-amber-100 flex items-center justify-center gap-1.5"
                >
                  <tui-icon icon="@tui.hourglass" class="w-6 h-6" /> {{ 'admin.dispute.awaitingSeller' | translate }}
                </button>
              </div>
              <textarea
                [(ngModel)]="statusNote"
                [placeholder]="'admin.dispute.notePh' | translate"
                rows="2"
                class="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-primary transition-colors"
              ></textarea>
            </div>
          }

          <!-- ── Assign panel (ADMIN only) ── -->
          @if (isAdmin() && !isTerminal()) {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.assignSection' | translate }}</p>
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="agentId"
                  [placeholder]="'admin.dispute.agentIdPh' | translate"
                  class="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
                <button
                  (click)="assignDispute()"
                  [disabled]="!agentId.trim() || actionLoading()"
                  class="px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
                  style="background: var(--clr-primary)"
                >
                  @if (actionLoading()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"></span>
                  } @else {
                    {{ 'admin.dispute.assign' | translate }}
                  }
                </button>
              </div>
            </div>
          }

          <!-- ── Resolution panel (SUPPORT + ADMIN, non-terminal) ── -->
          @if (!isTerminal()) {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.resolution' | translate }}</p>

              <!-- Resolution type picker -->
              <div class="space-y-2 mb-4">
                @for (r of resolutionTypes; track r.value) {
                  <label
                    class="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all"
                    [class.border-primary]="selectedResolution() === r.value"
                    [class.bg-primary-lt]="selectedResolution() === r.value"
                    [class.border-slate-200]="selectedResolution() !== r.value"
                    [class.hover:border-slate-300]="selectedResolution() !== r.value"
                  >
                    <input type="radio" [value]="r.value" [checked]="selectedResolution() === r.value"
                           (change)="selectedResolution.set(r.value)" class="sr-only" />
                    <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                         [class.border-primary]="selectedResolution() === r.value"
                         [class.border-slate-300]="selectedResolution() !== r.value">
                      @if (selectedResolution() === r.value) {
                        <div class="w-2 h-2 rounded-full bg-primary"></div>
                      }
                    </div>
                    <span class="text-sm font-medium text-slate-800">{{ r.labelKey | translate }}</span>
                  </label>
                }
              </div>

              <!-- Actor type selector -->
              <div class="mb-4">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 m-0">{{ 'admin.dispute.actorType' | translate }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <label
                    class="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
                    [class.border-primary]="selectedActorType() === 'BUYER'"
                    [class.bg-primary-lt]="selectedActorType() === 'BUYER'"
                    [class.border-slate-200]="selectedActorType() !== 'BUYER'"
                  >
                    <input type="radio" value="BUYER" [checked]="selectedActorType() === 'BUYER'"
                           (change)="selectedActorType.set('BUYER')" class="sr-only" />
                    <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                         [class.border-primary]="selectedActorType() === 'BUYER'"
                         [class.border-slate-300]="selectedActorType() !== 'BUYER'">
                      @if (selectedActorType() === 'BUYER') {
                        <div class="w-2 h-2 rounded-full bg-primary"></div>
                      }
                    </div>
                    <span class="text-sm font-semibold text-slate-800">{{ 'admin.dispute.buyer' | translate }}</span>
                  </label>
                  <label
                    class="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
                    [class.border-primary]="selectedActorType() === 'SELLER'"
                    [class.bg-primary-lt]="selectedActorType() === 'SELLER'"
                    [class.border-slate-200]="selectedActorType() !== 'SELLER'"
                  >
                    <input type="radio" value="SELLER" [checked]="selectedActorType() === 'SELLER'"
                           (change)="selectedActorType.set('SELLER')" class="sr-only" />
                    <div class="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all"
                         [class.border-primary]="selectedActorType() === 'SELLER'"
                         [class.border-slate-300]="selectedActorType() !== 'SELLER'">
                      @if (selectedActorType() === 'SELLER') {
                        <div class="w-2 h-2 rounded-full bg-primary"></div>
                      }
                    </div>
                    <span class="text-sm font-semibold text-slate-800">{{ 'admin.dispute.seller' | translate }}</span>
                  </label>
                </div>
              </div>

              <button
                (click)="applyResolution()"
                [disabled]="!selectedResolution() || resolving()"
                class="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                style="background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dk)); box-shadow: 0 4px 16px rgba(27,79,138,.3)"
              >
                @if (resolving()) {
                  <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  {{ 'admin.dispute.submitting' | translate }}
                } @else {
                  {{ 'admin.dispute.submitResolution' | translate }}
                }
              </button>
            </div>
          }

          <!-- ── Notes panel ── -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 m-0">{{ 'admin.dispute.notesSection' | translate }}</p>
            <textarea
              [(ngModel)]="notes"
              [placeholder]="'admin.dispute.notePh' | translate"
              rows="4"
              maxlength="5000"
              class="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-primary transition-colors mb-2"
            ></textarea>
            <button
              (click)="saveNotes()"
              [disabled]="savingNotes()"
              class="px-4 py-2 rounded-xl font-semibold text-sm text-white disabled:opacity-40 transition-all"
              style="background: var(--clr-primary)"
            >
              @if (savingNotes()) { {{ 'admin.dispute.savingNotes' | translate }} }
              @else { {{ 'admin.dispute.saveNotes' | translate }} }
            </button>
          </div>

          <!-- ── Message thread (SUPPORT only) ── -->
          @if (isSupport()) {
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div class="px-4 pt-4 pb-2">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wide m-0">{{ 'admin.dispute.messages' | translate }}</p>
              </div>

              <!-- messages -->
              <div class="space-y-2.5 max-h-96 overflow-y-auto px-4 py-2">
                @if (messages().length === 0) {
                  <p class="text-xs text-slate-400 text-center py-6 m-0">{{ 'admin.dispute.noMessages' | translate }}</p>
                }
                @for (msg of messages(); track msg.id) {
                  @if (isStaffMsg(msg)) {
                    <div class="flex justify-center">
                      <div class="max-w-[80%] text-center">
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1"
                          [class.bg-amber-100]="msg.messageType === 'SYSTEM'"
                          [class.text-amber-700]="msg.messageType === 'SYSTEM'"
                          [class.bg-indigo-100]="msg.messageType !== 'SYSTEM'"
                          [class.text-indigo-700]="msg.messageType !== 'SYSTEM'"
                        >{{ msg.messageType === 'SYSTEM' ? ('disputes.chat.system' | translate) : msg.senderName }}</span>
                        <div class="rounded-2xl px-3 py-2 border text-center"
                          [class.bg-amber-50]="msg.messageType === 'SYSTEM'"
                          [class.border-amber-200]="msg.messageType === 'SYSTEM'"
                          [class.bg-indigo-50]="msg.messageType !== 'SYSTEM'"
                          [class.border-indigo-200]="msg.messageType !== 'SYSTEM'"
                        >
                          <p class="text-xs italic m-0"
                            [class.text-amber-800]="msg.messageType === 'SYSTEM'"
                            [class.text-indigo-800]="msg.messageType !== 'SYSTEM'"
                          >{{ msg.content }}</p>
                          <p class="text-[10px] mt-0.5 opacity-60 m-0"
                            [class.text-amber-600]="msg.messageType === 'SYSTEM'"
                            [class.text-indigo-600]="msg.messageType !== 'SYSTEM'"
                          >{{ msg.createdAt | timeAgo }}</p>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="flex gap-2 items-start"
                         [class.flex-row-reverse]="msg.senderId === auth.userId()">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                           style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                        {{ msg.senderName[0] }}
                      </div>
                      <div class="flex-1 min-w-0" [class.items-end]="msg.senderId === auth.userId()">
                        <div class="flex items-center gap-1.5 mb-0.5"
                             [class.flex-row-reverse]="msg.senderId === auth.userId()">
                          <span class="text-xs font-bold text-slate-700">{{ msg.senderName }}</span>
                          <span class="text-[10px] text-slate-400">{{ msg.createdAt | timeAgo }}</span>
                        </div>
                        <div class="rounded-xl px-3 py-2 border"
                             [class.rounded-tl-sm]="msg.senderId !== auth.userId()"
                             [class.rounded-tr-sm]="msg.senderId === auth.userId()"
                             [class.bg-slate-50]="msg.senderId !== auth.userId()"
                             [class.border-slate-200]="msg.senderId !== auth.userId()"
                             [class.border-primary]="msg.senderId === auth.userId()"
                             [style.background]="msg.senderId === auth.userId() ? 'var(--clr-primary-lt)' : ''">
                          <p class="text-sm text-slate-800 m-0 break-words whitespace-pre-wrap">{{ msg.content }}</p>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- compose bar -->
              <div class="border-t border-slate-100 px-3 py-2.5 flex items-end gap-2">
                <textarea
                  [value]="msgText()"
                  (input)="msgText.set($any($event.target).value)"
                  (keydown.enter)="onMsgEnter($event)"
                  [placeholder]="'admin.dispute.msgPh' | translate"
                  rows="1"
                  class="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-primary transition-colors"
                  style="min-height:38px;max-height:120px"
                ></textarea>
                <button
                  (click)="sendMessage()"
                  [disabled]="!msgText().trim() || sendingMsg()"
                  class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
                  style="background: var(--clr-primary)"
                >
                  <tui-icon icon="@tui.send" class="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          }

        </div>
      }
    </div>
  `,
})
export class AdminDisputeDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly adminService  = inject(AdminService);
  protected readonly auth        = inject(AuthStore);
  private readonly toast         = inject(ToastService);
  private readonly stomp         = inject(StompService);

  private msgSub: StompSubscription | null = null;

  protected readonly dispute          = signal<DisputeResponse | null>(null);
  protected readonly loading          = signal(true);
  protected readonly actionLoading    = signal(false);
  protected readonly resolving        = signal(false);
  protected readonly savingNotes      = signal(false);
  protected readonly selectedResolution = signal<ResolutionType | ''>('');
  protected readonly selectedActorType  = signal<'BUYER' | 'SELLER' | ''>('');
  protected readonly messages         = signal<DisputeMessage[]>([]);
  protected readonly msgText          = signal('');
  protected readonly sendingMsg       = signal(false);

  protected readonly resolutionTypes = RESOLUTION_TYPES;

  protected notes     = '';
  protected agentId   = '';
  protected statusNote = '';

  protected isAdmin()    { return this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR'; }
  protected isSupport()  { return this.auth.role() === 'SUPPORT'; }
  protected isTerminal() { return TERMINAL.has(this.dispute()?.status ?? ''); }

  ngOnInit(): void {
    this.adminService.getDispute(this.id(), this.isAdmin()).subscribe({
      next: (d) => {
        this.dispute.set(d);
        this.messages.set(d.messages ?? []);
        this.loading.set(false);
        if (this.isSupport()) this.connectWs(d.id);
      },
      error: () => this.loading.set(false),
    });
  }

  private async connectWs(disputeId: string): Promise<void> {
    try {
      await this.stomp.connect();
      this.msgSub = this.stomp.subscribe(`/topic/dispute.${disputeId}`);
      this.stomp.on<DisputeMessage>(`/topic/dispute.${disputeId}`)
        .subscribe(msg => this.messages.update(m => [...m, msg]));
    } catch { /* WS unavailable — read-only degraded */ }
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
  }

  protected onMsgEnter(e: Event): void {
    if ((e as KeyboardEvent).shiftKey) return;
    e.preventDefault();
    this.sendMessage();
  }

  protected sendMessage(): void {
    const content = this.msgText().trim();
    if (!content || this.sendingMsg()) return;
    this.sendingMsg.set(true);
    try {
      this.stomp.publish(`/app/dispute/${this.id()}/message`, { content, internalOnly: false });
      this.msgText.set('');
    } finally {
      this.sendingMsg.set(false);
    }
  }

  protected applyResolution(): void {
    const rt        = this.selectedResolution();
    const actorType = this.selectedActorType() || undefined;
    const actorId   = this.auth.userId();
    if (!rt || this.resolving()) return;
    this.resolving.set(true);
    this.adminService.resolveDispute(this.id(), rt as ResolutionType, actorType, actorId).subscribe({
      next: (d) => { this.dispute.set(d); this.resolving.set(false); this.selectedActorType.set(''); },
      error: () => this.resolving.set(false),
    });
  }

  protected updateStatus(status: 'AWAITING_BUYER' | 'AWAITING_SELLER'): void {
    if (this.actionLoading()) return;
    this.actionLoading.set(true);
    this.adminService.updateDisputeStatus(this.id(), status, this.statusNote || undefined).subscribe({
      next: (d) => { this.dispute.set(d); this.actionLoading.set(false); this.statusNote = ''; },
      error: () => this.actionLoading.set(false),
    });
  }

  protected assignDispute(): void {
    if (!this.agentId.trim() || this.actionLoading()) return;
    this.actionLoading.set(true);
    this.adminService.assignDispute(this.id(), this.agentId.trim()).subscribe({
      next: (d) => { this.dispute.set(d); this.actionLoading.set(false); this.agentId = ''; },
      error: () => this.actionLoading.set(false),
    });
  }

  protected saveNotes(): void {
    if (this.savingNotes()) return;
    this.savingNotes.set(true);
    this.adminService.updateNotes(this.id(), this.notes).subscribe({
      next: () => { this.savingNotes.set(false); this.toast.success('Notes enregistrées.'); },
      error: () => this.savingNotes.set(false),
    });
  }

  private static STAFF = new Set(['SYSTEM','SUPPORT','ADMIN','SUPERVISOR']);
  protected isStaffMsg(msg: { messageType: string; senderRole: string }): boolean {
    return msg.messageType === 'SYSTEM' || AdminDisputeDetailComponent.STAFF.has(msg.senderRole?.toUpperCase());
  }
}
