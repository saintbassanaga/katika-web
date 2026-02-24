import { Component, inject, signal, OnInit, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EscrowService, TransactionDetail } from '../escrow.service';
import { AuthStore } from '@core/auth/auth.store';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '@core/notification/toast.service';

const STATUS_STEPS = ['INITIATED', 'LOCKED', 'SHIPPED', 'DELIVERED', 'RELEASED'];

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, DatePipe, TranslatePipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">

      <!-- Back -->
      <a routerLink="/escrow" class="flex items-center gap-2 text-sm text-gray-500 mb-4 hover:text-gray-700">
        ← {{ 'escrow.detail.back' | translate }}
      </a>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
          <div class="h-32 bg-gray-200 rounded-2xl"></div>
          <div class="h-24 bg-gray-200 rounded-2xl"></div>
        </div>
      } @else if (transaction()) {
        <div class="space-y-4">

          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-lg font-bold" style="color: var(--clr-text)">{{ transaction()!.reference }}</h1>
              <p class="text-sm mt-0.5" style="color: var(--clr-muted)">
                {{ transaction()!.createdAt | date:'dd/MM/yyyy à HH:mm' }}
              </p>

              <!-- Role context line -->
              @if (isBuyer()) {
                <p class="text-sm font-medium mt-1.5" style="color: var(--clr-primary)">
                  🛒 {{ 'escrow.detail.contextBuyer' | translate:{ name: transaction()!.sellerName } }}
                </p>
              } @else if (isSeller()) {
                <p class="text-sm font-medium mt-1.5" style="color: var(--clr-success)">
                  🏪 {{ 'escrow.detail.contextSeller' | translate:{ name: transaction()!.buyerName } }}
                </p>
              }
            </div>
            <app-status-badge [status]="transaction()!.status" />
          </div>

          <!-- Status timeline -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.progress' | translate }}
            </h2>
            <div class="flex items-center">
              @for (step of statusSteps; track step; let i = $index; let last = $last) {
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    [style.background]="isStepDone(step) ? 'var(--clr-primary)' : 'transparent'"
                    [style.border-color]="isStepDone(step) ? 'var(--clr-primary)' : 'var(--clr-border)'"
                    [style.color]="isStepDone(step) ? '#fff' : 'var(--clr-muted)'"
                  >
                    {{ isStepDone(step) ? '✓' : (i + 1) }}
                  </div>
                  <p class="text-xs mt-1 text-center w-16" style="color: var(--clr-muted)">
                    {{ 'escrow.detail.steps.' + step | translate }}
                  </p>
                  @if (stepTimestamp(step)) {
                    <p class="text-[10px] text-center w-16 leading-tight" style="color: #94A3B8">
                      {{ stepTimestamp(step) | date:'dd/MM HH:mm' }}
                    </p>
                  }
                </div>
                @if (!last) {
                  <div
                    class="flex-1 h-0.5 mx-1 mb-4"
                    [style.background]="isStepDone(step) ? 'var(--clr-primary)' : 'var(--clr-border)'"
                  ></div>
                }
              }
            </div>
          </div>

          <!-- Amount breakdown — emphasis differs by role -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.amount' | translate }}
            </h2>
            <div class="space-y-2">

              <!-- Gross amount — "You will pay" for buyer, muted info for seller -->
              <div class="flex justify-between text-sm font-semibold">
                <span [style.color]="isBuyer() ? 'var(--clr-text)' : 'var(--clr-muted)'">
                  @if (isBuyer()) {
                    {{ 'escrow.detail.grossAmountBuyer' | translate }}
                  } @else {
                    {{ 'escrow.detail.grossAmountSeller' | translate }}
                  }
                </span>
                <span [style.color]="isBuyer() ? 'var(--clr-primary)' : 'var(--clr-muted)'">
                  {{ transaction()!.grossAmount | amount }}
                </span>
              </div>

              <div class="flex justify-between text-sm">
                <span style="color: var(--clr-muted)">{{ 'escrow.detail.fee' | translate }}</span>
                <span style="color: var(--clr-error)">−{{ transaction()!.platformFee | amount }}</span>
              </div>

              <!-- Net amount — "You will receive" for seller, muted info for buyer -->
              <div class="border-t pt-2 flex justify-between text-sm font-semibold"
                   style="border-color: var(--clr-border)">
                <span [style.color]="isSeller() ? 'var(--clr-text)' : 'var(--clr-muted)'">
                  @if (isSeller()) {
                    {{ 'escrow.detail.netSeller' | translate }}
                  } @else {
                    {{ 'escrow.detail.netBuyer' | translate }}
                  }
                </span>
                <span [style.color]="isSeller() ? 'var(--clr-success)' : 'var(--clr-muted)'">
                  {{ transaction()!.netAmount | amount }}
                </span>
              </div>

            </div>
          </div>

          <!-- Parties — "you" badge on the current user's row -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold mb-3" style="color: var(--clr-muted)">
              {{ 'escrow.detail.parties' | translate }}
            </h2>
            <div class="space-y-3">

              <!-- Buyer row -->
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                     style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                  {{ transaction()!.buyerName[0] }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium" style="color: var(--clr-text)">
                      {{ transaction()!.buyerName }}
                    </p>
                    @if (isBuyer()) {
                      <span class="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                        {{ 'escrow.detail.you' | translate }}
                      </span>
                    }
                  </div>
                  <p class="text-xs" style="color: var(--clr-muted)">{{ 'escrow.detail.buyer' | translate }}</p>
                </div>
              </div>

              <!-- Seller row -->
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                     style="background: var(--clr-success-lt); color: var(--clr-success)">
                  {{ transaction()!.sellerName[0] }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium" style="color: var(--clr-text)">
                      {{ transaction()!.sellerName }}
                    </p>
                    @if (isSeller()) {
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

          <!-- SHIPPED → buyer confirme la réception physique du colis (POST /deliver) -->
          @if (isBuyer() && transaction()!.status === 'SHIPPED') {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <h2 class="text-sm font-semibold mb-0.5" style="color: var(--clr-text)">
                {{ 'escrow.detail.deliverSection.title' | translate }}
              </h2>
              <p class="text-xs mb-4" style="color: var(--clr-muted)">
                {{ 'escrow.detail.deliverSection.subtitle' | translate }}
              </p>
              <button
                (click)="deliver()"
                [disabled]="actionLoading()"
                class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                style="background: var(--clr-primary)"
              >
                📦 {{ actionLoading() ? ('common.loading' | translate) : ('escrow.detail.actions.deliver' | translate) }}
              </button>
            </div>
          }

          <!-- DELIVERED → buyer a vérifié et libère les fonds via QR ou code (POST /release) -->
          @if (isBuyer() && transaction()!.status === 'DELIVERED') {
            <div class="bg-white rounded-2xl p-4 shadow-sm">
              <h2 class="text-sm font-semibold mb-0.5" style="color: var(--clr-text)">
                {{ 'escrow.detail.confirmSection.title' | translate }}
              </h2>
              <p class="text-xs mb-4" style="color: var(--clr-muted)">
                {{ 'escrow.detail.confirmSection.subtitle' | translate }}
              </p>

              <!-- Scan QR -->
              <a
                [routerLink]="['/escrow', transaction()!.id, 'scan']"
                class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style="background: var(--clr-primary)"
              >
                📷 {{ 'escrow.detail.actions.scanQr' | translate }}
              </a>

              <!-- Séparateur -->
              <div class="flex items-center gap-2 my-4">
                <div class="flex-1 h-px" style="background: var(--clr-border)"></div>
                <span class="text-xs px-1" style="color: var(--clr-muted)">
                  {{ 'escrow.detail.confirmSection.or' | translate }}
                </span>
                <div class="flex-1 h-px" style="background: var(--clr-border)"></div>
              </div>

              <!-- Saisie manuelle du code -->
              <div class="space-y-2">
                <input
                  type="text"
                  [value]="confirmCode()"
                  (input)="confirmCode.set($any($event.target).value)"
                  [placeholder]="'escrow.detail.confirmSection.codePh' | translate"
                  class="w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2"
                  style="border-color: var(--clr-border); color: var(--clr-text);
                         background: var(--clr-surface, #F8FAFC); --tw-ring-color: var(--clr-primary)"
                />
                <button
                  (click)="confirmReception()"
                  [disabled]="actionLoading() || !confirmCode().trim()"
                  class="flex items-center justify-center gap-2 w-full py-3 text-white
                         rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
                  style="background: var(--clr-success)"
                >
                  ✓ {{ actionLoading() ? ('common.loading' | translate) : ('escrow.detail.actions.confirmReception' | translate) }}
                </button>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="space-y-2">

            @if (isSeller() && transaction()!.status === 'LOCKED') {
              <a
                [routerLink]="['/escrow', transaction()!.id, 'qr']"
                class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style="background: var(--clr-success)"
              >
                🔲 {{ 'escrow.detail.actions.generateQr' | translate }}
              </a>
              <button
                (click)="ship()"
                [disabled]="actionLoading()"
                class="flex items-center justify-center gap-2 w-full py-3 text-white
                       rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style="background: var(--clr-primary)"
              >
                🚚 {{ actionLoading() ? ('common.loading' | translate) : ('escrow.detail.actions.ship' | translate) }}
              </button>
            }

            @if (['LOCKED', 'SHIPPED', 'DELIVERED'].includes(transaction()!.status)) {
              <a
                [routerLink]="['/disputes/new']"
                [queryParams]="{ transactionId: transaction()!.id }"
                class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors hover:opacity-90"
                style="border: 1.5px solid var(--clr-error); color: var(--clr-error)"
              >
                ⚠ {{ 'escrow.detail.actions.dispute' | translate }}
              </a>
            }

            @if (['INITIATED', 'LOCKED'].includes(transaction()!.status)) {
              <button
                (click)="cancel()"
                [disabled]="actionLoading()"
                class="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                style="border: 1.5px solid var(--clr-border); color: var(--clr-muted)"
              >
                {{ actionLoading() ? ('common.loading' | translate) : ('escrow.detail.actions.cancel' | translate) }}
              </button>
            }

          </div>
        </div>
      }
    </div>
  `,
})
export class TransactionDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly escrowService = inject(EscrowService);
  private readonly auth          = inject(AuthStore);
  private readonly router        = inject(Router);
  private readonly toast         = inject(ToastService);

  protected readonly loading       = signal(true);
  protected readonly actionLoading = signal(false);
  protected readonly transaction   = signal<TransactionDetail | null>(null);
  protected readonly statusSteps   = STATUS_STEPS;
  protected readonly confirmCode   = signal('');

  /** True when the logged-in user is the buyer of THIS transaction */
  protected isBuyer(): boolean {
    const tx = this.transaction();
    return !!tx && tx.buyerId === this.auth.user()?.userId;
  }

  /** True when the logged-in user is the seller of THIS transaction */
  protected isSeller(): boolean {
    const tx = this.transaction();
    return !!tx && tx.sellerId === this.auth.user()?.userId;
  }

  ngOnInit(): void {
    this.escrowService.getTransaction(this.id()).subscribe({
      next: (tx) => { this.transaction.set(tx); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected deliver(): void {
    this.actionLoading.set(true);
    this.escrowService.deliver(this.id()).subscribe({
      next: (tx) => { this.transaction.set(tx); this.actionLoading.set(false); },
      error: () => this.actionLoading.set(false),
    });
  }

  protected ship(): void {
    this.actionLoading.set(true);
    this.escrowService.ship(this.id()).subscribe({
      next: (tx) => { this.transaction.set(tx); this.actionLoading.set(false); },
      error: () => this.actionLoading.set(false),
    });
  }

  protected confirmReception(): void {
    const code = this.confirmCode().trim();
    if (!code) return;
    this.actionLoading.set(true);
    this.escrowService.release(this.id(), code).subscribe({
      next: (tx) => {
        this.transaction.set(tx);
        this.confirmCode.set('');
        this.actionLoading.set(false);
      },
      error: () => this.actionLoading.set(false),
    });
  }

  protected cancel(): void {
    this.actionLoading.set(true);
    this.escrowService.cancel(this.id()).subscribe({
      next: () => this.router.navigate(['/escrow']),
      error: () => this.actionLoading.set(false),
    });
  }

  protected isStepDone(step: string): boolean {
    const tx = this.transaction();
    if (!tx) return false;
    return STATUS_STEPS.indexOf(step) <= STATUS_STEPS.indexOf(tx.status);
  }

  protected stepTimestamp(step: string): string | null {
    const tx = this.transaction();
    if (!tx) return null;
    const map: Record<string, string | null> = {
      INITIATED: tx.createdAt,
      LOCKED:    tx.lockedAt,
      SHIPPED:   tx.shippedAt,
      DELIVERED: tx.deliveredAt,
      RELEASED:  tx.releasedAt,
    };
    return map[step] ?? null;
  }
}
