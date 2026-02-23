import { Component, inject, signal, OnInit, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EscrowService, TransactionDetail } from '../escrow.service';
import { AuthStore } from '@core/auth/auth.store';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '@ngx-translate/core';

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
          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-lg font-bold text-gray-900">{{ transaction()!.reference }}</h1>
              <p class="text-sm text-gray-500">{{ transaction()!.createdAt | date:'dd/MM/yyyy à HH:mm' }}</p>
            </div>
            <app-status-badge [status]="transaction()!.status" />
          </div>

          <!-- Status timeline -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">{{ 'escrow.detail.progress' | translate }}</h2>
            <div class="flex items-center">
              @for (step of statusSteps; track step; let i = $index; let last = $last) {
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    [class.bg-blue-600]="isStepDone(step)"
                    [class.border-blue-600]="isStepDone(step)"
                    [class.text-white]="isStepDone(step)"
                    [class.border-gray-200]="!isStepDone(step)"
                    [class.text-gray-400]="!isStepDone(step)"
                  >
                    {{ isStepDone(step) ? '✓' : (i + 1) }}
                  </div>
                  <p class="text-xs text-gray-500 mt-1 text-center w-16">{{ 'escrow.detail.steps.' + step | translate }}</p>
                  @if (stepTimestamp(step)) {
                    <p class="text-[10px] text-gray-400 text-center w-16 leading-tight">
                      {{ stepTimestamp(step) | date:'dd/MM HH:mm' }}
                    </p>
                  }
                </div>
                @if (!last) {
                  <div class="flex-1 h-0.5 mx-1 mb-4"
                       [class.bg-blue-600]="isStepDone(step)"
                       [class.bg-gray-200]="!isStepDone(step)">
                  </div>
                }
              }
            </div>
          </div>

          <!-- Amount breakdown -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">{{ 'escrow.detail.amount' | translate }}</h2>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">{{ 'escrow.detail.grossAmount' | translate }}</span>
                <span class="font-medium">{{ transaction()!.grossAmount | amount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">{{ 'escrow.detail.fee' | translate }}</span>
                <span class="text-red-600">-{{ transaction()!.platformFee | amount }}</span>
              </div>
              <div class="border-t border-gray-100 pt-2 flex justify-between text-sm font-semibold">
                <span>{{ 'escrow.detail.net' | translate }}</span>
                <span class="text-green-600">{{ transaction()!.netAmount | amount }}</span>
              </div>
            </div>
          </div>

          <!-- Parties -->
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <h2 class="text-sm font-semibold text-gray-700 mb-3">{{ 'escrow.detail.parties' | translate }}</h2>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                  {{ transaction()!.buyerName[0] }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ transaction()!.buyerName }}</p>
                  <p class="text-xs text-gray-500">{{ 'escrow.detail.buyer' | translate }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold">
                  {{ transaction()!.sellerName[0] }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ transaction()!.sellerName }}</p>
                  <p class="text-xs text-gray-500">{{ 'escrow.detail.seller' | translate }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            @if (isBuyer() && transaction()!.status === 'DELIVERED') {
              <a
                [routerLink]="['/escrow', transaction()!.id, 'scan']"
                class="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white
                       rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                📷 {{ 'escrow.detail.actions.scanQr' | translate }}
              </a>
            }
            @if (isSeller() && transaction()!.status === 'LOCKED') {
              <a
                [routerLink]="['/escrow', transaction()!.id, 'qr']"
                class="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white
                       rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
              >
                🔲 {{ 'escrow.detail.actions.generateQr' | translate }}
              </a>
            }
            @if (['LOCKED', 'SHIPPED'].includes(transaction()!.status)) {
              <a
                [routerLink]="['/disputes/new']"
                [queryParams]="{ transactionId: transaction()!.id }"
                class="flex items-center justify-center gap-2 w-full py-3 border border-red-300
                       text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
              >
                ⚠ {{ 'escrow.detail.actions.dispute' | translate }}
              </a>
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
  private readonly auth = inject(AuthStore);
  protected readonly loading = signal(true);
  protected readonly transaction = signal<TransactionDetail | null>(null);
  protected readonly statusSteps = STATUS_STEPS;

  protected isBuyer() { return this.auth.isBuyer(); }
  protected isSeller() { return this.auth.isSeller(); }

  ngOnInit(): void {
    this.escrowService.getTransaction(this.id()).subscribe({
      next: (tx) => { this.transaction.set(tx); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected isStepDone(step: string): boolean {
    const tx = this.transaction();
    if (!tx) return false;
    const currentIdx = STATUS_STEPS.indexOf(tx.status);
    const stepIdx = STATUS_STEPS.indexOf(step);
    return stepIdx <= currentIdx;
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
