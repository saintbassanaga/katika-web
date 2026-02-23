import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { BottomSheetComponent } from '../../shared/components/bottom-sheet/bottom-sheet.component';
import { TranslatePipe } from '@ngx-translate/core';

type MovementType =
  | 'ESCROW_FREEZE'
  | 'ESCROW_RELEASE'
  | 'ESCROW_CREDIT'
  | 'PAYOUT_DEBIT'
  | 'PAYOUT_REFUND'
  | 'ADMIN_CREDIT'
  | 'ADMIN_DEBIT';

interface WalletBalance {
  balance: number;
  frozenAmount: number;
  currency: string;
}

interface WalletMovement {
  id: string;
  type: MovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  frozenBefore: number;
  frozenAfter: number;
  reference: string;
  description: string;
  createdAt: string;
}

const TYPE_FILTERS: { labelKey: string; types: string } [] = [
  { labelKey: 'wallet.filter.all',     types: '' },
  { labelKey: 'wallet.filter.escrow',  types: 'ESCROW_FREEZE,ESCROW_RELEASE,ESCROW_CREDIT' },
  { labelKey: 'wallet.filter.payouts', types: 'PAYOUT_DEBIT,PAYOUT_REFUND' },
];

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [RouterLink, AmountPipe, TimeAgoPipe, EmptyStateComponent, LoadingSkeletonComponent, BottomSheetComponent, TranslatePipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">

      <!-- Balance card -->
      <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-6">
        <p class="text-blue-100 text-sm mb-1">{{ 'wallet.balance' | translate }}</p>
        <div class="flex items-center gap-2 mb-1">
          @if (balanceVisible()) {
            <span class="text-3xl font-bold">{{ wallet()?.balance | amount }}</span>
          } @else {
            <span class="text-3xl font-bold">••••••</span>
          }
          <button (click)="balanceVisible.set(!balanceVisible())" class="text-blue-200 hover:text-white">
            {{ balanceVisible() ? '🙈' : '👁' }}
          </button>
        </div>
        @if ((wallet()?.frozenAmount ?? 0) > 0) {
          <p class="text-blue-200 text-xs">{{ 'wallet.frozen' | translate }}: {{ wallet()?.frozenAmount | amount }}</p>
        }
        <div class="flex gap-2 mt-4">
          <a routerLink="/payouts/new"
             class="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-center transition-colors">
            {{ 'wallet.withdrawBtn' | translate }}
          </a>
          <button
            (click)="refresh()"
            class="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-center transition-colors"
          >
            {{ 'wallet.refreshBtn' | translate }}
          </button>
        </div>
      </div>

      <!-- Movements -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-900">{{ 'wallet.history' | translate }}</h2>
      </div>

      <!-- Type filter chips -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        @for (f of typeFilters; track f.types) {
          <button
            (click)="setTypeFilter(f.types)"
            class="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border"
            [class.bg-blue-600]="activeTypeFilter() === f.types"
            [class.text-white]="activeTypeFilter() === f.types"
            [class.border-blue-600]="activeTypeFilter() === f.types"
            [class.bg-white]="activeTypeFilter() !== f.types"
            [class.text-gray-600]="activeTypeFilter() !== f.types"
            [class.border-gray-200]="activeTypeFilter() !== f.types"
          >
            {{ f.labelKey | translate }}
          </button>
        }
      </div>

      @if (loading()) {
        <app-loading-skeleton [count]="5" />
      } @else if (movements().length === 0) {
        <app-empty-state icon="📊" [title]="'wallet.empty.title' | translate" [message]="'wallet.empty.message' | translate" />
      } @else {
        <div class="space-y-2">
          @for (mov of movements(); track mov.id) {
            <button
              (click)="selectedMovement.set(mov); sheetOpen.set(true)"
              class="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                [class.bg-green-100]="isCredit(mov)"
                [class.text-green-600]="isCredit(mov)"
                [class.bg-red-100]="!isCredit(mov)"
                [class.text-red-600]="!isCredit(mov)"
              >
                {{ isCredit(mov) ? '▲' : '▼' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ mov.description }}</p>
                <p class="text-xs text-gray-500">{{ mov.reference }} · {{ mov.createdAt | timeAgo }}</p>
              </div>
              <p
                class="text-sm font-bold shrink-0"
                [class.text-green-600]="isCredit(mov)"
                [class.text-red-600]="!isCredit(mov)"
              >
                {{ isCredit(mov) ? '+' : '-' }}{{ mov.amount | amount }}
              </p>
            </button>
          }

          @if (hasMore()) {
            <button (click)="loadMore()" [disabled]="loadingMore()"
                    class="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
              {{ loadingMore() ? ('common.loading' | translate) : ('common.loadMore' | translate) }}
            </button>
          }
        </div>
      }
    </div>

    <!-- Movement detail bottom sheet -->
    <app-bottom-sheet [open]="sheetOpen()" [title]="'wallet.detail.title' | translate" (close)="sheetOpen.set(false)">
      @if (selectedMovement()) {
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">{{ 'wallet.detail.reference' | translate }}</span>
            <span class="font-medium">{{ selectedMovement()!.reference }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">{{ 'wallet.detail.amount' | translate }}</span>
            <span class="font-semibold" [class.text-green-600]="isCredit(selectedMovement()!)"
                                        [class.text-red-600]="!isCredit(selectedMovement()!)">
              {{ isCredit(selectedMovement()!) ? '+' : '-' }}{{ selectedMovement()!.amount | amount }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">{{ 'wallet.detail.balanceBefore' | translate }}</span>
            <span>{{ selectedMovement()!.balanceBefore | amount }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">{{ 'wallet.detail.balanceAfter' | translate }}</span>
            <span>{{ selectedMovement()!.balanceAfter | amount }}</span>
          </div>
          @if (selectedMovement()!.frozenBefore !== selectedMovement()!.frozenAfter) {
            <div class="border-t border-gray-100 pt-2 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">{{ 'wallet.detail.frozenBefore' | translate }}</span>
                <span>{{ selectedMovement()!.frozenBefore | amount }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">{{ 'wallet.detail.frozenAfter' | translate }}</span>
                <span>{{ selectedMovement()!.frozenAfter | amount }}</span>
              </div>
            </div>
          }
          <div class="text-sm">
            <span class="text-gray-500">{{ 'wallet.detail.description' | translate }}</span>
            <p class="mt-1 text-gray-700">{{ selectedMovement()!.description }}</p>
          </div>
        </div>
      }
    </app-bottom-sheet>
  `,
})
export class WalletComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly typeFilters = TYPE_FILTERS;
  protected readonly wallet = signal<WalletBalance | null>(null);
  protected readonly movements = signal<WalletMovement[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(false);
  protected readonly balanceVisible = signal(false);
  protected readonly sheetOpen = signal(false);
  protected readonly selectedMovement = signal<WalletMovement | null>(null);
  protected readonly activeTypeFilter = signal('');
  private page = 0;

  ngOnInit(): void {
    this.loadWallet();
    this.loadMovements();
  }

  protected setTypeFilter(types: string): void {
    this.activeTypeFilter.set(types);
    this.page = 0;
    this.movements.set([]);
    this.loadMovements();
  }

  private loadWallet(): void {
    this.http.get<WalletBalance>(`${environment.apiUrl}/api/wallet`, { withCredentials: true })
      .subscribe({ next: (w) => this.wallet.set(w) });
  }

  private loadMovements(): void {
    this.loading.set(true);
    this.fetchMovements();
  }

  protected loadMore(): void {
    this.page++;
    this.loadingMore.set(true);
    this.fetchMovements();
  }

  protected refresh(): void {
    this.page = 0;
    this.movements.set([]);
    this.loadWallet();
    this.loadMovements();
  }

  private fetchMovements(): void {
    const typeParam = this.activeTypeFilter() ? `&type=${this.activeTypeFilter()}` : '';
    this.http.get<{ content: WalletMovement[]; totalPages: number }>(
      `${environment.apiUrl}/api/wallet/movements?page=${this.page}&size=20${typeParam}`,
      { withCredentials: true },
    ).subscribe({
      next: (data) => {
        this.movements.update(m => this.page === 0 ? data.content : [...m, ...data.content]);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  protected isCredit(mov: WalletMovement): boolean {
    return mov.balanceAfter >= mov.balanceBefore;
  }
}
