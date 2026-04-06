import { Component, inject, signal, DestroyRef, input, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AuthStore } from '@core/auth/auth.store';
import { StompService } from '@core/websocket/stomp.service';
import { ToastService } from '@core/notification/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TuiIcon } from '@taiga-ui/core';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { StompSubscription } from '@stomp/stompjs';
import { TransactionDetail } from '@app/models';
import {
  escrowKeys,
  injectAcceptEscrowMutation,
  injectCancelEscrowMutation,
  injectDeliverEscrowMutation,
  injectEscrowDetailQuery,
  injectReleaseEscrowMutation,
  injectShipEscrowMutation,
} from '../escrow.queries';

interface EscrowStatusUpdate {
  transactionId: string;
  reference: string;
  status: string;
  occurredAt: string;
}

const STATUS_TIMESTAMP: Partial<Record<string, keyof TransactionDetail>> = {
  LOCKED:    'lockedAt',
  SHIPPED:   'shippedAt',
  DELIVERED: 'deliveredAt',
  RELEASED:  'releasedAt',
  CANCELLED: 'releasedAt',
};

// Visual steps shown in the timeline (INITIATED is transient — no dedicated timestamp)
const STATUS_STEPS = ['PENDING_ACCEPTANCE', 'LOCKED', 'SHIPPED', 'DELIVERED', 'RELEASED'];

// Full ordering used by isStepDone — INITIATED sits between PENDING_ACCEPTANCE and LOCKED
const STATUS_ORDER: Record<string, number> = {
  PENDING_ACCEPTANCE: 0,
  INITIATED:          1,
  LOCKED:             2,
  SHIPPED:            3,
  DELIVERED:          4,
  RELEASED:           5,
};

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, DatePipe, TranslatePipe, LoadingSkeletonComponent, TuiIcon],
  template: `
    <div class="animate-fade px-4 py-6 pb-24 max-w-lg mx-auto">

      <a routerLink="/escrow" class="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-gray-700">
        <tui-icon icon="@tui.arrow-left" class="w-4 h-4" /> {{ 'escrow.detail.back' | translate }}
      </a>

      @if (query.isPending()) {
        <app-loading-skeleton></app-loading-skeleton>
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
          <div class="h-32 bg-gray-200 rounded-2xl"></div>
          <div class="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      } @else if (query.data(); as tx) {
        <div class="space-y-4">

          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-lg font-bold" style="color: var(--clr-text)">{{ tx.reference }}</h1>
              <p class="text-sm mt-0.5" style="color: var(--clr-muted)">
                {{ tx.createdAt | date:'dd/MM/yyyy à HH:mm' }}
              </p>
              @if (isBuyer(tx)) {
                <p class="text-sm font-medium mt-1.5 flex items-center gap-1" style="color: var(--clr-primary)">
                  <tui-icon icon="@tui.shopping-cart" class="w-4 h-4" /> {{ 'escrow.detail.contextBuyer' | translate:{name: tx.sellerName} }}
                </p>
              } @else if (isSeller(tx)) {
                <p class="text-sm font-medium mt-1.5 flex items-center gap-1" style="color: var(--clr-success)">
                  <tui-icon icon="@tui.store" class="w-4 h-4" /> {{ 'escrow.detail.contextSeller' | translate:{name: tx.buyerName} }}
                </p>
              }
            </div>
            <div class="flex flex-col items-end gap-2">
              <app-status-badge [status]="tx.status"/>
              @if (liveConnected()) {
                <span class="flex items-center gap-1 text-[10px] font-semibold text-success">
                  <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                  {{ 'escrow.detail.live' | translate }}
                </span>
              }
            </div>
          </div>

          <!-- Status timeline -->
          <div class="animate-entry bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.progress' | translate }}
            </h2>
            <div class="flex items-end">
              @for (step of statusSteps; track step; let i = $index; let last = $last) {
                <div class="flex-1 min-w-0 flex flex-col items-center">
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0"
                    [style.background]="isStepDone(step, tx) ? 'var(--clr-primary)' : 'transparent'"
                    [style.border-color]="isStepDone(step, tx) ? 'var(--clr-primary)' : 'var(--clr-border)'"
                    [style.color]="isStepDone(step, tx) ? '#fff' : 'var(--clr-muted)'"
                  >
                    @if (isStepDone(step, tx)) { <tui-icon icon="@tui.check" class="w-3 h-3" /> } @else { {{ i + 1 }} }
                  </div>
                  <p class="text-[10px] mt-1 text-center w-full px-0.5 leading-tight" style="color: var(--clr-muted)">
                    {{ 'escrow.detail.steps.' + step | translate }}
                  </p>
                  @if (stepTimestamp(step, tx)) {
                    <p class="text-[9px] text-center w-full px-0.5 leading-tight" style="color: #94A3B8">
                      {{ stepTimestamp(step, tx) | date:'dd/MM HH:mm' }}
                    </p>
                  }
                </div>
                @if (!last) {
                  <div class="w-3 shrink-0 h-0.5 mb-8"
                       [style.background]="isStepDone(step, tx) ? 'var(--clr-primary)' : 'var(--clr-border)'">
                  </div>
                }
              }
            </div>
          </div>

          <!-- Amount breakdown -->
          <div class="animate-entry bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.amount' | translate }}
            </h2>
            <div class="space-y-2">
              <!-- Gross amount — always visible -->
              <div class="flex justify-between text-sm font-semibold">
                <span style="color: var(--clr-text)">
                  @if (isBuyer(tx)) {
                    {{ 'escrow.detail.grossAmountBuyer' | translate }}
                  } @else {
                    {{ 'escrow.detail.grossAmountSeller' | translate }}
                  }
                </span>
                <span style="color: var(--clr-primary)">{{ tx.grossAmount | amount }}</span>
              </div>

              <!-- Fee breakdown — visible only once funds are locked -->
              @if (tx.platformFee != null && tx.netAmount != null) {
                <div class="flex justify-between text-sm">
                  <span style="color: var(--clr-muted)">{{ 'escrow.detail.fee' | translate }}</span>
                  <span style="color: var(--clr-error)">−{{ tx.platformFee | amount }}</span>
                </div>
                <div class="border-t pt-2 flex justify-between text-sm font-semibold"
                     style="border-color: var(--clr-border)">
                  <span [style.color]="isSeller(tx) ? 'var(--clr-text)' : 'var(--clr-muted)'">
                    @if (isSeller(tx)) {
                      {{ 'escrow.detail.netSeller' | translate }}
                    } @else {
                      {{ 'escrow.detail.netBuyer' | translate }}
                    }
                  </span>
                  <span [style.color]="isSeller(tx) ? 'var(--clr-success)' : 'var(--clr-muted)'">
                    {{ tx.netAmount | amount }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Parties -->
          <div class="animate-entry bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.parties' | translate }}
            </h2>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                     style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                  {{ tx.buyerName[0] }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium" style="color: var(--clr-text)">{{ tx.buyerName }}</p>
                    @if (isBuyer(tx)) {
                      <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                        {{ 'escrow.detail.you' | translate }}
                      </span>
                    }
                  </div>
                  <p class="text-xs" style="color: var(--clr-muted)">{{ 'escrow.detail.buyer' | translate }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                     style="background: var(--clr-success-lt); color: var(--clr-success)">
                  {{ tx.sellerName[0] }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium" style="color: var(--clr-text)">{{ tx.sellerName }}</p>
                    @if (isSeller(tx)) {
                      <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            style="background: var(--clr-success-lt); color: var(--clr-success)">
                        {{ 'escrow.detail.you' | translate }}
                      </span>
                    }
                  </div>
                  <p class="text-xs" style="color: var(--clr-muted)">{{ 'escrow.detail.seller' | translate }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action: accept transaction (PENDING_ACCEPTANCE → buyer) -->
          @if (isBuyer(tx) && tx.status === 'PENDING_ACCEPTANCE') {
            <div class="bg-white rounded-2xl p-4 shadow-sm border-l-4"
                 style="border-left-color: var(--clr-gold)">
              <h2 class="text-sm font-semibold mb-0.5" style="color: var(--clr-text)">
                {{ 'escrow.detail.acceptSection.title' | translate }}
              </h2>
              <p class="text-xs mb-4" style="color: var(--clr-muted)">
                {{ 'escrow.detail.acceptSection.subtitle' | translate }}
              </p>
              <div class="space-y-2">
                <button (click)="accept(tx.id)" [disabled]="acceptMutation.isPending() || cancelMutation.isPending()"
                        class="flex items-center justify-center gap-2 w-full py-3 text-white
                         rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                        style="background: var(--clr-gold)">
                  @if (acceptMutation.isPending()) {
                    <tui-icon icon="@tui.loader-circle" class="w-4 h-4 animate-spin" />
                  } @else {
                    <tui-icon icon="@tui.credit-card" class="w-4 h-4" />
                  }
                  {{ acceptMutation.isPending() ? ('common.loading' | translate) : ('escrow.detail.actions.accept' | translate) }}
                </button>
                <button (click)="cancel(tx.id)" [disabled]="cancelMutation.isPending() || acceptMutation.isPending()"
                        class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm
                         transition-colors disabled:opacity-50"
                        style="border: 2px solid var(--clr-border); color: var(--clr-muted)">
                  {{ cancelMutation.isPending() ? ('common.loading' | translate) : ('escrow.detail.actions.reject' | translate) }}
                </button>
              </div>
            </div>
          }

          <!-- Seller sees a waiting notice when PENDING_ACCEPTANCE -->
          @if (isSeller(tx) && tx.status === 'PENDING_ACCEPTANCE') {
            <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
              <tui-icon icon="@tui.hourglass" class="w-8 h-8 mb-2 mx-auto" style="color: var(--clr-muted)" />
              <p class="text-sm font-medium" style="color: var(--clr-text)">
                {{ 'escrow.detail.acceptSection.waitingTitle' | translate }}
              </p>
              <p class="text-xs mt-1" style="color: var(--clr-muted)">
                {{ 'escrow.detail.acceptSection.waitingSubtitle' | translate }}
              </p>
            </div>
          }

          <!-- Action: confirm delivery (SHIPPED → buyer) -->
          @if (isBuyer(tx) && tx.status === 'SHIPPED') {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <h2 class="text-sm font-semibold mb-0.5" style="color: var(--clr-text)">
                {{ 'escrow.detail.deliverSection.title' | translate }}
              </h2>
              <p class="text-xs mb-4" style="color: var(--clr-muted)">
                {{ 'escrow.detail.deliverSection.subtitle' | translate }}
              </p>
              <button (click)="deliver(tx.id)" [disabled]="deliverMutation.isPending()"
                      class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                      style="background: var(--clr-primary)">
                <tui-icon icon="@tui.package" class="w-4 h-4" /> {{ deliverMutation.isPending() ? ('common.loading' | translate) : ('escrow.detail.actions.deliver' | translate) }}
              </button>
            </div>
          }

          <!-- Action: release funds (DELIVERED → buyer) -->
          @if (isBuyer(tx) && tx.status === 'DELIVERED') {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <h2 class="text-sm font-semibold mb-0.5" style="color: var(--clr-text)">
                {{ 'escrow.detail.confirmSection.title' | translate }}
              </h2>
              <p class="text-xs mb-4" style="color: var(--clr-muted)">
                {{ 'escrow.detail.confirmSection.subtitle' | translate }}
              </p>
              <a [routerLink]="['/escrow', tx.id, 'scan']"
                 class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                 style="background: var(--clr-primary)">
                <tui-icon icon="@tui.scan" class="w-4 h-4" /> {{ 'escrow.detail.actions.scanQr' | translate }}
              </a>
              <div class="flex items-center gap-2 my-4">
                <div class="flex-1 h-px" style="background: var(--clr-border)"></div>
                <span class="text-xs px-1" style="color: var(--clr-muted)">
                  {{ 'escrow.detail.confirmSection.or' | translate }}
                </span>
                <div class="flex-1 h-px" style="background: var(--clr-border)"></div>
              </div>
              <!-- Code hint callout -->
              <div class="flex items-start gap-2.5 rounded-xl p-3 mb-3"
                   style="background: var(--clr-primary-lt)">
                <tui-icon icon="@tui.info" class="w-4 h-4 shrink-0 mt-0.5" style="color: var(--clr-primary)" />
                <p class="text-xs m-0 leading-snug" style="color: var(--clr-primary)">
                  {{ 'escrow.detail.confirmSection.codeHint' | translate }}
                </p>
              </div>
              <div class="space-y-2">
                <div class="relative">
                  <tui-icon icon="@tui.key" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style="color: var(--clr-muted)" />
                  <input type="text"
                         [value]="confirmCode()"
                         (input)="confirmCode.set($any($event.target).value)"
                         [placeholder]="'escrow.detail.confirmSection.codePh' | translate"
                         class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2"
                         style="border-color: var(--clr-border); color: var(--clr-text);
                           background: var(--clr-surface, #F8FAFC); --tw-ring-color: var(--clr-primary)"
                  />
                </div>
                <button (click)="release(tx.id)"
                        [disabled]="releaseMutation.isPending() || !confirmCode().trim()"
                        class="flex items-center justify-center gap-2 w-full py-3 text-white
                         rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                        style="background: var(--clr-success)">
                  @if (releaseMutation.isPending()) {
                    <tui-icon icon="@tui.loader-circle" class="w-4 h-4 animate-spin" />
                    {{ 'common.loading' | translate }}
                  } @else {
                    <tui-icon icon="@tui.check" class="w-4 h-4" />
                    {{ 'escrow.detail.actions.confirmReception' | translate }}
                  }
                </button>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="space-y-2">
            @if (isSeller(tx) && ['LOCKED', 'DELIVERED'].includes(tx.status)) {
              <a [routerLink]="['/escrow', tx.id, 'qr']"
                 class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                 style="background: var(--clr-success)">
                <tui-icon icon="@tui.qr-code" class="w-4 h-4" /> {{ 'escrow.detail.actions.generateQr' | translate }}
              </a>
            }
            @if (isSeller(tx) && tx.status === 'LOCKED') {
              <button (click)="ship(tx.id)" [disabled]="shipMutation.isPending()"
                      class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                      style="background: var(--clr-primary)">
                <tui-icon icon="@tui.truck" class="w-4 h-4" /> {{ shipMutation.isPending() ? ('common.loading' | translate) : ('escrow.detail.actions.ship' | translate) }}
              </button>
            }
            @if (tx.activeDisputeId) {
              <a [routerLink]="['/disputes', tx.activeDisputeId]"
                 class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
                 style="background: #FEF2F2; border: 2px solid var(--clr-error); color: var(--clr-error)">
                <tui-icon icon="@tui.message-circle" class="w-4 h-4" />
                {{ 'escrow.detail.actions.viewDispute' | translate }}
              </a>
            } @else if (['LOCKED', 'SHIPPED', 'DELIVERED'].includes(tx.status)) {
              <button (click)="openDispute(tx.id)"
                      class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
                      style="border: 2px solid var(--clr-error); color: var(--clr-error)">
                <tui-icon icon="@tui.alert-triangle" class="w-4 h-4" /> {{ 'escrow.detail.actions.openDispute' | translate }}
              </button>
            }
            @if (['INITIATED', 'LOCKED'].includes(tx.status) || (tx.status === 'PENDING_ACCEPTANCE' && isSeller(tx))) {
              <button (click)="cancel(tx.id)" [disabled]="cancelMutation.isPending()"
                      class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                      style="border: 2px solid var(--clr-border); color: var(--clr-muted)">
                {{ cancelMutation.isPending() ? ('common.loading' | translate) : ('escrow.detail.actions.cancel' | translate) }}
              </button>
            }
          </div>

        </div>
      }
    </div>
  `,
})
export class TransactionDetailComponent {
  readonly id = input.required<string>();

  private readonly auth        = inject(AuthStore);
  private readonly router      = inject(Router);
  private readonly toast       = inject(ToastService);
  private readonly stomp       = inject(StompService);
  private readonly translate   = inject(TranslateService);
  private readonly queryClient = inject(QueryClient);
  private readonly destroyRef  = inject(DestroyRef);

  protected readonly query           = injectEscrowDetailQuery(this.id);
  protected readonly acceptMutation  = injectAcceptEscrowMutation();
  protected readonly shipMutation    = injectShipEscrowMutation();
  protected readonly deliverMutation = injectDeliverEscrowMutation();
  protected readonly releaseMutation = injectReleaseEscrowMutation();
  protected readonly cancelMutation  = injectCancelEscrowMutation();

  protected readonly liveConnected = signal(false);
  protected readonly confirmCode   = signal('');
  protected readonly statusSteps   = STATUS_STEPS;

  private stompSub: StompSubscription | null = null;

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && !this.liveConnected()) this.connectLive(id);
    });

    this.destroyRef.onDestroy(() => {
      this.stompSub?.unsubscribe();
      this.liveConnected.set(false);
    });
  }

  private connectLive(txId: string): void {
    this.stomp.connect().then(() => {
      this.stompSub = this.stomp.subscribe(`/topic/escrow.${txId}`);
      this.liveConnected.set(true);

      this.stomp.on<EscrowStatusUpdate>(`/topic/escrow.${txId}`).subscribe(update => {
        // Optimistic patch for instant visual feedback
        if (update.status) {
          this.queryClient.setQueryData<TransactionDetail>(
            escrowKeys.detail(txId),
            (prev) => {
              if (!prev) return prev;
              const tsField = STATUS_TIMESTAMP[update.status];
              return { ...prev, status: update.status, ...(tsField ? { [tsField]: update.occurredAt } : {}) };
            },
          );
        }
        // Full refetch to hydrate all fields (platformFee, netAmount, activeDisputeId, …)
        this.queryClient.invalidateQueries({ queryKey: escrowKeys.detail(txId) });
        // Keep the list in sync so status chips reflect the change immediately
        this.queryClient.invalidateQueries({ queryKey: escrowKeys.lists() });
        this.toast.success(
          this.translate.instant('escrow.detail.liveUpdate', { status: update.status }),
        );
      });
    }).catch(() => { /* WebSocket unavailable — REST state is still accurate */ });
  }

  protected isBuyer(tx: TransactionDetail): boolean {
    return tx.buyerId === this.auth.user()?.userId;
  }

  protected isSeller(tx: TransactionDetail): boolean {
    return tx.sellerId === this.auth.user()?.userId;
  }

  protected accept(id: string): void  { this.acceptMutation.mutate(id); }
  protected ship(id: string): void    { this.shipMutation.mutate(id); }
  protected deliver(id: string): void { this.deliverMutation.mutate(id); }
  protected cancel(id: string): void  {
    this.cancelMutation.mutate(id, {
      onSuccess: () => this.router.navigate(['/escrow']),
    });
  }

  protected release(id: string): void {
    const code = this.confirmCode().trim();
    if (!code) return;
    this.releaseMutation.mutate({ id, verificationCode: code }, {
      onSuccess: () => this.confirmCode.set(''),
    });
  }

  protected openDispute(id: string): void {
    this.router.navigate(['/disputes/new'], { queryParams: { transactionId: id } });
  }

  protected isStepDone(step: string, tx: TransactionDetail): boolean {
    return (STATUS_ORDER[step] ?? -1) <= (STATUS_ORDER[tx.status] ?? -1);
  }

  protected stepTimestamp(step: string, tx: TransactionDetail): string | null {
    const map: Record<string, string | null> = {
      PENDING_ACCEPTANCE: tx.createdAt,
      LOCKED:             tx.lockedAt,
      SHIPPED:            tx.shippedAt,
      DELIVERED:          tx.deliveredAt,
      RELEASED:           tx.releasedAt,
    };
    return map[step] ?? null;
  }
}
