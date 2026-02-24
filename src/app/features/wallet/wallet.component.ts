import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { BottomSheetComponent } from '../../shared/components/bottom-sheet/bottom-sheet.component';
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
  styles: [`
    :host { display: block; }

    /* ── Hero ─────────────────────────────────────────── */
    .hero {
      position: relative;
      overflow: hidden;
      background: var(--clr-dark);
      padding: 2.75rem 1.5rem 2rem;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(72px);
    }
    .orb-gold {
      width: 260px; height: 260px;
      top: -80px; right: -60px;
      background: radial-gradient(circle, rgba(201,146,13,.22) 0%, transparent 70%);
    }
    .orb-blue {
      width: 200px; height: 200px;
      bottom: -50px; left: -50px;
      background: radial-gradient(circle, rgba(27,79,138,.25) 0%, transparent 70%);
    }

    .hero-label {
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: rgba(255,255,255,.38);
      margin-bottom: 1rem;
    }

    .balance-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .5rem;
      margin-bottom: .625rem;
    }

    .balance-amount {
      font-size: clamp(2rem, 8vw, 3rem);
      font-weight: 800;
      letter-spacing: -.04em;
      line-height: 1;
      color: #fff;
    }
    .balance-hidden {
      color: rgba(255,255,255,.18);
      letter-spacing: .08em;
    }

    .eye-btn {
      flex-shrink: 0;
      width: 36px; height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.45);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      margin-top: 4px;
      transition: background .15s;
    }
    .eye-btn:hover { background: rgba(255,255,255,.12); color: rgba(255,255,255,.75); }

    .frozen-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(201,146,13,.1);
      border: 1px solid rgba(201,146,13,.28);
      border-radius: 99px;
      padding: 4px 12px;
      margin-bottom: 1.5rem;
      font-size: .75rem;
      font-weight: 600;
      color: #D4A330;
    }

    .action-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: .625rem;
    }
    .btn-withdraw {
      padding: .8125rem;
      border-radius: 12px;
      background: var(--clr-primary);
      border: none;
      color: #fff;
      font-size: .875rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      display: block;
      transition: opacity .15s;
    }
    .btn-withdraw:hover { opacity: .88; }
    .btn-refresh {
      padding: .8125rem;
      border-radius: 12px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      color: rgba(255,255,255,.55);
      font-size: .875rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background .15s;
    }
    .btn-refresh:hover { background: rgba(255,255,255,.12); color: rgba(255,255,255,.8); }

    /* ── Content section ──────────────────────────────── */
    .content {
      padding: 0 1rem 6rem;
      background: var(--clr-page);
      min-height: 50vh;
    }

    .section-head {
      padding: 1.25rem 0 .875rem;
      font-size: .9375rem;
      font-weight: 700;
      color: var(--clr-text);
    }

    .filters {
      display: flex;
      gap: .5rem;
      overflow-x: auto;
      padding-bottom: .875rem;
      scrollbar-width: none;
    }
    .filters::-webkit-scrollbar { display: none; }

    .chip {
      flex-shrink: 0;
      padding: 5px 16px;
      border-radius: 99px;
      font-size: .8125rem;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid;
      font-family: inherit;
      transition: all .15s;
      white-space: nowrap;
    }
    .chip-on {
      background: var(--clr-primary);
      border-color: var(--clr-primary);
      color: #fff;
    }
    .chip-off {
      background: var(--clr-surface);
      border-color: var(--clr-border);
      color: var(--clr-muted);
    }

    /* ── Movement cards ───────────────────────────────── */
    .list { display: flex; flex-direction: column; gap: .5rem; }

    .mov {
      width: 100%;
      display: flex;
      align-items: center;
      gap: .875rem;
      background: var(--clr-surface);
      border: 1px solid var(--clr-border);
      border-left-width: 3px;
      border-radius: 14px;
      padding: .875rem 1rem;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: box-shadow .15s;
    }
    .mov:hover { box-shadow: 0 2px 12px rgba(15,34,64,.08); }
    .mov-c { border-left-color: var(--clr-success); }
    .mov-d { border-left-color: var(--clr-error); }

    .mov-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: .9375rem;
    }
    .mov-icon-c { background: var(--clr-success-lt); }
    .mov-icon-d { background: var(--clr-error-lt); }

    .mov-desc {
      font-size: .875rem;
      font-weight: 600;
      color: var(--clr-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mov-meta {
      font-size: .6875rem;
      color: var(--clr-muted);
      margin-top: 2px;
    }

    .mov-amt {
      font-size: .9375rem;
      font-weight: 800;
      flex-shrink: 0;
      letter-spacing: -.01em;
    }
    .mov-amt-c { color: var(--clr-success); }
    .mov-amt-d { color: var(--clr-error); }

    /* ── Skeleton ─────────────────────────────────────── */
    .skel {
      height: 64px;
      border-radius: 14px;
    }

    /* ── Empty ────────────────────────────────────────── */
    .empty {
      text-align: center;
      padding: 4rem 1.5rem;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: .75rem; opacity: .35; }
    .empty-title { font-size: .9375rem; font-weight: 600; color: var(--clr-muted); }
    .empty-sub   { font-size: .8125rem; color: #94A3B8; margin-top: .25rem; }

    /* ── Load more ────────────────────────────────────── */
    .load-more {
      width: 100%;
      padding: .875rem;
      border: 1.5px dashed var(--clr-border);
      border-radius: 12px;
      color: var(--clr-muted);
      font-size: .875rem;
      background: transparent;
      cursor: pointer;
      font-family: inherit;
      transition: border-color .15s, color .15s;
    }
    .load-more:hover:not(:disabled) {
      border-color: var(--clr-primary);
      color: var(--clr-primary);
    }

    /* ── Detail sheet ─────────────────────────────────── */
    .d-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: .625rem 0;
      border-bottom: 1px solid var(--clr-border);
      font-size: .875rem;
    }
    .d-row:last-child { border-bottom: none; }
    .d-lbl { color: var(--clr-muted); }
    .d-val { font-weight: 600; color: var(--clr-text); }
    .d-amt-c { color: var(--clr-success) !important; }
    .d-amt-d { color: var(--clr-error)   !important; }
  `],
  template: `
    <!-- ── Hero ─────────────────────────────────────── -->
    <div class="hero">
      <div class="orb orb-gold orb-1"></div>
      <div class="orb orb-blue orb-2"></div>

      <p class="hero-label">{{ 'wallet.balance' | translate }}</p>

      <div class="balance-row">
        @if (balanceVisible()) {
          <div class="balance-amount">{{ wallet()?.balance | amount }}</div>
        } @else {
          <div class="balance-amount balance-hidden">••••••</div>
        }
        <button class="eye-btn" (click)="balanceVisible.set(!balanceVisible())">
          @if (balanceVisible()) {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          } @else {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          }
        </button>
      </div>

      @if ((wallet()?.frozenAmount ?? 0) > 0) {
        <div class="frozen-pill">
          🔒 {{ 'wallet.frozen' | translate }}: {{ wallet()?.frozenAmount | amount }}
        </div>
      }

      <div class="action-row">
        <a routerLink="/payouts/new" class="btn-withdraw">{{ 'wallet.withdrawBtn' | translate }}</a>
        <button class="btn-refresh" (click)="refresh()">{{ 'wallet.refreshBtn' | translate }}</button>
      </div>
    </div>

    <!-- ── Movements ─────────────────────────────────── -->
    <div class="content">

      <h2 class="section-head">{{ 'wallet.history' | translate }}</h2>

      <div class="filters">
        @for (f of typeFilters; track f.types) {
          <button
            class="chip"
            [class.chip-on]="activeTypeFilter() === f.types"
            [class.chip-off]="activeTypeFilter() !== f.types"
            (click)="setTypeFilter(f.types)"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      @if (loading()) {
        <div class="list">
          @for (i of skeletons; track i) {
            <div class="skel skeleton-shimmer"></div>
          }
        </div>

      } @else if (movements().length === 0) {
        <div class="empty">
          <div class="empty-icon">📊</div>
          <p class="empty-title">{{ 'wallet.empty.title' | translate }}</p>
          <p class="empty-sub">{{ 'wallet.empty.message' | translate }}</p>
        </div>

      } @else {
        <div class="list">
          @for (mov of movements(); track mov.id) {
            <button
              class="mov"
              [class.mov-c]="isCredit(mov)"
              [class.mov-d]="!isCredit(mov)"
              (click)="selectedMovement.set(mov); sheetOpen.set(true)"
            >
              <div
                class="mov-icon"
                [class.mov-icon-c]="isCredit(mov)"
                [class.mov-icon-d]="!isCredit(mov)"
              >{{ typeIcon(mov.type) }}</div>

              <div style="flex:1; min-width:0;">
                <p class="mov-desc">{{ mov.description }}</p>
                <p class="mov-meta">{{ mov.reference }} · {{ mov.createdAt | timeAgo }}</p>
              </div>

              <p class="mov-amt" [class.mov-amt-c]="isCredit(mov)" [class.mov-amt-d]="!isCredit(mov)">
                {{ isCredit(mov) ? '+' : '−' }}{{ mov.amount | amount }}
              </p>
            </button>
          }

          @if (hasMore()) {
            <button class="load-more" (click)="loadMore()" [disabled]="loadingMore()">
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
          <div style="text-align:center; padding:.5rem 0 1.5rem;">
            <p
              style="font-size:2rem; font-weight:900; letter-spacing:-.03em;"
              [class.d-amt-c]="isCredit(mov)"
              [class.d-amt-d]="!isCredit(mov)"
            >{{ isCredit(mov) ? '+' : '−' }}{{ mov.amount | amount }}</p>
            <p style="font-size:.8125rem; color:var(--clr-muted); margin-top:4px;">{{ mov.description }}</p>
          </div>

          <div class="d-row">
            <span class="d-lbl">{{ 'wallet.detail.reference' | translate }}</span>
            <span class="d-val" style="font-family:monospace; font-size:.8125rem;">{{ mov.reference }}</span>
          </div>
          <div class="d-row">
            <span class="d-lbl">{{ 'wallet.detail.balanceBefore' | translate }}</span>
            <span class="d-val">{{ mov.balanceBefore | amount }}</span>
          </div>
          <div class="d-row">
            <span class="d-lbl">{{ 'wallet.detail.balanceAfter' | translate }}</span>
            <span class="d-val">{{ mov.balanceAfter | amount }}</span>
          </div>

          @if (mov.frozenBefore !== mov.frozenAfter) {
            <div class="d-row" style="border-top: 1px solid var(--clr-border); margin-top:.25rem;">
              <span class="d-lbl">{{ 'wallet.detail.frozenBefore' | translate }}</span>
              <span class="d-val">{{ mov.frozenBefore | amount }}</span>
            </div>
            <div class="d-row">
              <span class="d-lbl">{{ 'wallet.detail.frozenAfter' | translate }}</span>
              <span class="d-val">{{ mov.frozenAfter | amount }}</span>
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
