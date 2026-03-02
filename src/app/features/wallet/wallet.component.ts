import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { BottomSheetComponent } from '@shared/components/bottom-sheet/bottom-sheet.component';
import { TranslatePipe } from '@ngx-translate/core';

type MovementType =
  | 'ESCROW_FREEZE'   | 'ESCROW_UNFREEZE'  | 'ESCROW_CREDIT'
  | 'REFUND_UNFREEZE' | 'REFUND_CREDIT'
  | 'DISPUTE_FREEZE'  | 'DISPUTE_REFUND_BUYER' | 'DISPUTE_RELEASE_SELLER'
  | 'DISPUTE_SPLIT_BUYER' | 'DISPUTE_SPLIT_SELLER'
  | 'PAYOUT_DEBIT'    | 'PAYOUT_REVERSAL'
  | 'DEPOSIT_CREDIT'  | 'PLATFORM_FEE_CREDIT'
  | 'FEE_DEBIT'       | 'FEE_CREDIT'
  | 'ADMIN_CREDIT'    | 'ADMIN_DEBIT';

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

const TYPE_FILTERS: { labelKey: string; types: string }[] = [
  {
    labelKey: 'wallet.filter.all',
    types: '',
  },
  {
    labelKey: 'wallet.filter.escrow',
    types: 'ESCROW_FREEZE,ESCROW_UNFREEZE,ESCROW_CREDIT',
  },
  {
    labelKey: 'wallet.filter.disputes',
    types: 'DISPUTE_FREEZE,DISPUTE_REFUND_BUYER,DISPUTE_RELEASE_SELLER,DISPUTE_SPLIT_BUYER,DISPUTE_SPLIT_SELLER',
  },
  {
    labelKey: 'wallet.filter.payouts',
    types: 'PAYOUT_DEBIT,PAYOUT_REVERSAL',
  },
];

const TYPE_ICONS: Record<MovementType, string> = {
  ESCROW_FREEZE:          '🔒',
  ESCROW_UNFREEZE:        '🔓',
  ESCROW_CREDIT:          '✦',
  REFUND_UNFREEZE:        '↩',
  REFUND_CREDIT:          '↩',
  DISPUTE_FREEZE:         '⚖',
  DISPUTE_REFUND_BUYER:   '⚖',
  DISPUTE_RELEASE_SELLER: '⚖',
  DISPUTE_SPLIT_BUYER:    '⚖',
  DISPUTE_SPLIT_SELLER:   '⚖',
  PAYOUT_DEBIT:           '↗',
  PAYOUT_REVERSAL:        '↩',
  DEPOSIT_CREDIT:         '↙',
  PLATFORM_FEE_CREDIT:    '✦',
  FEE_DEBIT:              '−',
  FEE_CREDIT:             '+',
  ADMIN_CREDIT:           '+',
  ADMIN_DEBIT:            '−',
};

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [RouterLink, AmountPipe, TimeAgoPipe, BottomSheetComponent, TranslatePipe],
  styles: [':host { display: block; }'],
  template: `
    <!-- ── Hero ─────────────────────────────────────── -->
    <div class="relative overflow-hidden bg-dark px-6 pt-11 pb-8">
      <div class="absolute rounded-full pointer-events-none blur-[72px] w-[260px] h-[260px] top-[-80px] right-[-60px] bg-[radial-gradient(circle,rgba(201,146,13,.22)_0%,transparent_70%)] orb-1"></div>
      <div class="absolute rounded-full pointer-events-none blur-[72px] w-[200px] h-[200px] bottom-[-50px] left-[-50px] bg-[radial-gradient(circle,rgba(27,79,138,.25)_0%,transparent_70%)] orb-2"></div>

      <p class="text-[.6875rem] font-bold tracking-[.14em] uppercase text-white/[.38] mb-4">{{ 'wallet.balance' | translate }}</p>

      <div class="flex items-start justify-between gap-2 mb-2.5">
        @if (balanceVisible()) {
          <div class="text-[clamp(2rem,8vw,3rem)] font-extrabold tracking-[-0.04em] leading-none text-white">{{ wallet()?.balance | amount }}</div>
        } @else {
          <div class="text-[clamp(2rem,8vw,3rem)] font-extrabold tracking-[.08em] leading-none text-white/[.18]">••••••</div>
        }
        <button class="shrink-0 w-9 h-9 rounded-[10px] bg-white/[.07] border border-white/10 text-white/45 cursor-pointer flex items-center justify-center mt-1 transition-colors hover:bg-white/[.12] hover:text-white/75" (click)="balanceVisible.set(!balanceVisible())">
          @if (balanceVisible()) {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          } @else {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          }
        </button>
      </div>

      @if ((wallet()?.frozenAmount ?? 0) > 0) {
        <div class="inline-flex items-center gap-[5px] bg-[rgba(201,146,13,.1)] border border-[rgba(201,146,13,.28)] rounded-full px-3 py-1 mb-6 text-xs font-semibold text-[#D4A330]">
          🔒 {{ 'wallet.frozen' | translate }}: {{ wallet()?.frozenAmount | amount }}
        </div>
      }

      <div class="grid grid-cols-2 gap-2.5">
        <a routerLink="/payouts/new"
           class="py-[.8125rem] rounded-xl bg-primary border-none text-white text-sm font-bold font-[inherit] cursor-pointer text-center no-underline block transition-opacity hover:opacity-[.88]">
          {{ 'wallet.withdrawBtn' | translate }}
        </a>
        <button class="py-[.8125rem] rounded-xl bg-white/[.07] border border-white/10 text-white/55 text-sm font-semibold font-[inherit] cursor-pointer transition-colors hover:bg-white/[.12] hover:text-white/80"
                (click)="refresh()">
          {{ 'wallet.refreshBtn' | translate }}
        </button>
      </div>
    </div>

    <!-- ── Movements ─────────────────────────────────── -->
    <div class="px-4 pb-24 bg-page min-h-[50vh]">

      <h2 class="pt-5 pb-3.5 text-[.9375rem] font-bold text-slate-800">{{ 'wallet.history' | translate }}</h2>

      <div class="flex gap-2 overflow-x-auto pb-3.5 scrollbar-hide">
        @for (f of typeFilters; track f.types) {
          <button
            class="shrink-0 px-4 py-[5px] rounded-full text-[.8125rem] font-semibold cursor-pointer border-[1.5px] font-[inherit] transition-all whitespace-nowrap"
            [class]="activeTypeFilter() === f.types
              ? 'bg-primary border-primary text-white'
              : 'bg-white border-slate-200 text-slate-500'"
            (click)="setTypeFilter(f.types)"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-2">
          @for (i of skeletons; track i) {
            <div class="h-16 rounded-[14px] skeleton-shimmer"></div>
          }
        </div>

      } @else if (movements().length === 0) {
        <div class="text-center py-16 px-6">
          <div class="text-[2.5rem] mb-3 opacity-35">📊</div>
          <p class="text-[.9375rem] font-semibold text-slate-500">{{ 'wallet.empty.title' | translate }}</p>
          <p class="text-[.8125rem] text-slate-400 mt-1">{{ 'wallet.empty.message' | translate }}</p>
        </div>

      } @else {
        <div class="flex flex-col gap-2">
          @for (mov of movements(); track mov.id) {
            <button
              class="w-full flex items-center gap-3.5 bg-white border border-slate-200 border-l-[3px] rounded-[14px] px-4 py-3.5 cursor-pointer text-left font-[inherit] transition-shadow hover:shadow-[0_2px_12px_rgba(15,34,64,.08)]"
              [class.border-l-success]="isCredit(mov)"
              [class.border-l-error]="!isCredit(mov)"
              (click)="selectedMovement.set(mov); sheetOpen.set(true)"
            >
              <div
                class="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center text-[.9375rem]"
                [class.bg-success-lt]="isCredit(mov)"
                [class.bg-error-lt]="!isCredit(mov)"
              >{{ typeIcon(mov.type) }}</div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis m-0">{{ mov.description }}</p>
                <p class="text-[.6875rem] text-slate-400 mt-0.5 m-0">{{ mov.reference }} · {{ mov.createdAt | timeAgo }}</p>
              </div>

              <p class="text-[.9375rem] font-extrabold shrink-0 tracking-[-0.01em] m-0"
                 [class.text-success]="isCredit(mov)"
                 [class.text-error]="!isCredit(mov)">
                {{ isCredit(mov) ? '+' : '−' }}{{ mov.amount | amount }}
              </p>
            </button>
          }

          @if (hasMore()) {
            <button class="w-full py-3.5 border-[1.5px] border-dashed border-slate-200 rounded-xl text-slate-400 text-sm bg-transparent cursor-pointer font-[inherit] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                    (click)="loadMore()" [disabled]="loadingMore()">
              {{ loadingMore() ? ('common.loading' | translate) : ('common.loadMore' | translate) }}
            </button>
          }
        </div>
      }

    </div>

    <!-- ── Detail bottom sheet ───────────────────────── -->
    <app-bottom-sheet
      [open]="sheetOpen()"
      [title]="'wallet.detail.title' | translate"
      (close)="sheetOpen.set(false)"
    >
      @if (selectedMovement(); as mov) {
        <div>
          <div class="text-center py-2 pb-6">
            <p class="text-[2rem] font-black tracking-[-0.03em] m-0"
               [class.text-success]="isCredit(mov)"
               [class.text-error]="!isCredit(mov)">
              {{ isCredit(mov) ? '+' : '−' }}{{ mov.amount | amount }}
            </p>
            <p class="text-[.8125rem] text-slate-400 mt-1 m-0">{{ mov.description }}</p>
          </div>

          <div class="flex justify-between items-baseline py-2.5 border-b border-slate-100 text-sm last:border-b-0">
            <span class="text-slate-400">{{ 'wallet.detail.reference' | translate }}</span>
            <span class="font-semibold text-slate-700 font-mono text-[.8125rem]">{{ mov.reference }}</span>
          </div>
          <div class="flex justify-between items-baseline py-2.5 border-b border-slate-100 text-sm">
            <span class="text-slate-400">{{ 'wallet.detail.balanceBefore' | translate }}</span>
            <span class="font-semibold text-slate-700">{{ mov.balanceBefore | amount }}</span>
          </div>
          <div class="flex justify-between items-baseline py-2.5 border-b border-slate-100 text-sm last:border-b-0">
            <span class="text-slate-400">{{ 'wallet.detail.balanceAfter' | translate }}</span>
            <span class="font-semibold text-slate-700">{{ mov.balanceAfter | amount }}</span>
          </div>

          @if (mov.frozenBefore !== mov.frozenAfter) {
            <div class="flex justify-between items-baseline py-2.5 border-t border-b border-slate-100 text-sm mt-1">
              <span class="text-slate-400">{{ 'wallet.detail.frozenBefore' | translate }}</span>
              <span class="font-semibold text-slate-700">{{ mov.frozenBefore | amount }}</span>
            </div>
            <div class="flex justify-between items-baseline py-2.5 text-sm">
              <span class="text-slate-400">{{ 'wallet.detail.frozenAfter' | translate }}</span>
              <span class="font-semibold text-slate-700">{{ mov.frozenAfter | amount }}</span>
            </div>
          }
        </div>
      }
    </app-bottom-sheet>
  `,
})
export class WalletComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly typeFilters  = TYPE_FILTERS;
  protected readonly skeletons    = [1, 2, 3, 4, 5];

  protected readonly wallet           = signal<WalletBalance | null>(null);
  protected readonly movements        = signal<WalletMovement[]>([]);
  protected readonly loading          = signal(true);
  protected readonly loadingMore      = signal(false);
  protected readonly hasMore          = signal(false);
  protected readonly balanceVisible   = signal(false);
  protected readonly sheetOpen        = signal(false);
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

  protected typeIcon(type: MovementType): string {
    return TYPE_ICONS[type] ?? '·';
  }
}
