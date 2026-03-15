import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { TransactionSummary } from '@shared/models/model';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

const STATUS_FILTERS = [
  { value: '',           labelKey: 'disputes.filters.all' },
  { value: 'INITIATED',  labelKey: 'admin.transactions.filters.initiated' },
  { value: 'LOCKED',     labelKey: 'admin.transactions.filters.locked' },
  { value: 'SHIPPED',    labelKey: 'admin.transactions.filters.shipped' },
  { value: 'DELIVERED',  labelKey: 'admin.transactions.filters.delivered' },
  { value: 'RELEASED',   labelKey: 'admin.transactions.filters.released' },
  { value: 'DISPUTED',   labelKey: 'admin.transactions.filters.disputed' },
  { value: 'CANCELLED',  labelKey: 'admin.transactions.filters.cancelled' },
  { value: 'REFUNDED',   labelKey: 'admin.transactions.filters.refunded' },
];

const MILESTONES: { key: keyof TransactionSummary; labelKey: string }[] = [
  { key: 'createdAt',   labelKey: 'admin.transactions.ms.created'   },
  { key: 'lockedAt',    labelKey: 'admin.transactions.ms.locked'    },
  { key: 'shippedAt',   labelKey: 'admin.transactions.ms.shipped'   },
  { key: 'deliveredAt', labelKey: 'admin.transactions.ms.delivered' },
  { key: 'releasedAt',  labelKey: 'admin.transactions.ms.released'  },
  { key: 'disputedAt',  labelKey: 'admin.transactions.ms.disputed'  },
  { key: 'refundedAt',  labelKey: 'admin.transactions.ms.refunded'  },
];

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [RouterLink, DatePipe, AmountPipe, TimeAgoPipe, StatusBadgeComponent, TranslatePipe],
  styles: [':host { display: block; height: 100%; overflow-y: auto; }'],
  template: `
    <div class="animate-fade flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/admin/dashboard"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-white m-0">{{ 'admin.transactions.title' | translate }}</h1>
          @if (!loading()) {
            <p class="text-xs text-white/50 m-0">{{ totalElements() }} {{ 'admin.transactions.totalSuffix' | translate }}</p>
          }
        </div>
      </div>

      <!-- Filter chips -->
      <div class="px-4 md:px-8 pt-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
        @for (f of statusFilters; track f.value) {
          <button
            (click)="setStatusFilter(f.value)"
            class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap"
            [class]="activeStatus() === f.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 px-4 md:px-8 py-3 pb-24 md:pb-8 max-w-4xl mx-auto w-full">

        @if (loading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                <div class="flex items-center gap-3">
                  <div class="skeleton-shimmer w-11 h-11 rounded-[14px] shrink-0"></div>
                  <div class="flex-1 space-y-1.5">
                    <div class="skeleton-shimmer h-3.5 w-1/3 rounded"></div>
                    <div class="skeleton-shimmer h-2.5 w-1/4 rounded"></div>
                  </div>
                  <div class="skeleton-shimmer h-6 w-20 rounded-full"></div>
                </div>
                <div class="skeleton-shimmer h-px w-full rounded"></div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="skeleton-shimmer h-8 rounded-xl"></div>
                  <div class="skeleton-shimmer h-8 rounded-xl"></div>
                  <div class="skeleton-shimmer h-8 rounded-xl"></div>
                </div>
                <div class="skeleton-shimmer h-px w-full rounded"></div>
                <div class="flex gap-2">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="skeleton-shimmer h-6 flex-1 rounded-lg"></div>
                  }
                </div>
              </div>
            }
          </div>

        } @else if (transactions().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4">💳</div>
            <p class="text-base font-bold text-slate-900 m-0 mb-1">{{ 'admin.transactions.empty' | translate }}</p>
          </div>

        } @else {
          <div class="flex flex-col gap-3">
            @for (tx of transactions(); track tx.id) {
              <div class="bg-white rounded-2xl shadow-[0_1px_4px_rgba(15,23,42,.06)] overflow-hidden">

                <!-- ── Header ── -->
                <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div class="w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center text-xl"
                       [class]="txIconBg(tx.status)">{{ txEmoji(tx.status) }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-900 m-0 font-mono tracking-tight">{{ tx.reference }}</p>
                    <p class="text-[11px] text-slate-400 m-0 mt-0.5">{{ tx.createdAt | timeAgo }} · {{ tx.currency }}</p>
                  </div>
                  <app-status-badge [status]="tx.status" />
                </div>

                <div class="mx-4 border-t border-slate-100"></div>

                <!-- ── Parties ── -->
                <div class="flex items-center gap-3 px-4 py-3">
                  <!-- Buyer -->
                  <div class="flex items-center gap-2 min-w-0 flex-1">
                    <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-primary/10 text-primary">
                      {{ tx.buyerName[0] }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.buyer' | translate }}</p>
                      <p class="text-xs font-semibold text-slate-800 m-0 truncate">{{ tx.buyerName }}</p>
                    </div>
                  </div>
                  <!-- Arrow -->
                  <svg class="text-slate-300 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <!-- Seller -->
                  <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <div class="min-w-0 text-right">
                      <p class="text-[10px] text-slate-400 m-0">{{ 'admin.dispute.seller' | translate }}</p>
                      <p class="text-xs font-semibold text-slate-800 m-0 truncate">{{ tx.sellerName }}</p>
                    </div>
                    <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-success-lt text-success">
                      {{ tx.sellerName[0] }}
                    </div>
                  </div>
                </div>

                <div class="mx-4 border-t border-slate-100"></div>

                <!-- ── Amount breakdown ── -->
                <div class="grid grid-cols-3 gap-px bg-slate-100 mx-4 my-3 rounded-xl overflow-hidden">
                  <div class="bg-white px-3 py-2.5 text-center">
                    <p class="text-[10px] text-slate-400 m-0 mb-0.5">{{ 'admin.transactions.gross' | translate }}</p>
                    <p class="text-sm font-bold text-slate-900 m-0">{{ tx.grossAmount | amount }}</p>
                  </div>
                  <div class="bg-white px-3 py-2.5 text-center">
                    <p class="text-[10px] text-slate-400 m-0 mb-0.5">{{ 'admin.transactions.fee' | translate }}</p>
                    <p class="text-sm font-bold text-orange-500 m-0">{{ tx.platformFee | amount }}</p>
                  </div>
                  <div class="bg-white px-3 py-2.5 text-center">
                    <p class="text-[10px] text-slate-400 m-0 mb-0.5">{{ 'admin.transactions.net' | translate }}</p>
                    <p class="text-sm font-bold text-success m-0">{{ tx.netAmount | amount }}</p>
                  </div>
                </div>

                <!-- ── Milestone timeline ── -->
                <div class="px-4 pb-4">
                  <div class="flex items-start gap-1 overflow-x-auto scrollbar-hide">
                    @for (ms of milestones; track ms.key) {
                      @let date = tx[ms.key];
                      @if (date) {
                        <div class="shrink-0 flex flex-col items-center min-w-[64px]">
                          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] mb-1"
                               [class]="ms.key === 'disputedAt' ? 'bg-red-100 text-red-500' : ms.key === 'refundedAt' ? 'bg-orange-100 text-orange-500' : 'bg-success-lt text-success'">
                            ✓
                          </div>
                          <p class="text-[9px] font-semibold text-slate-500 m-0 text-center leading-tight">{{ ms.labelKey | translate }}</p>
                          <p class="text-[9px] text-slate-400 m-0 text-center mt-0.5">{{ date | date:'dd/MM HH:mm' }}</p>
                        </div>
                        @if (!$last) {
                          <div class="flex-1 h-px bg-slate-200 mt-2.5 min-w-[8px] shrink-0"></div>
                        }
                      }
                    }
                  </div>
                </div>

              </div>
            }

            @if (hasMore()) {
              <button
                (click)="loadMore()"
                [disabled]="loadingMore()"
                class="w-full py-3 mt-1 border border-slate-200 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition-colors bg-white"
              >
                @if (loadingMore()) { {{ 'common.loading' | translate }} } @else { {{ 'common.loadMore' | translate }} }
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminTransactionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly transactions  = signal<TransactionSummary[]>([]);
  protected readonly loading       = signal(true);
  protected readonly loadingMore   = signal(false);
  protected readonly hasMore       = signal(false);
  protected readonly totalElements = signal(0);
  protected readonly activeStatus  = signal('');

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly milestones    = MILESTONES;

  private page = 0;

  ngOnInit(): void { this.load(); }

  protected setStatusFilter(status: string): void {
    this.activeStatus.set(status);
    this.page = 0;
    this.transactions.set([]);
    this.load();
  }

  protected loadMore(): void {
    this.page++;
    this.loadingMore.set(true);
    this.fetch(false);
  }

  private load(): void {
    this.loading.set(true);
    this.fetch(true);
  }

  private fetch(reset: boolean): void {
    this.adminService.getAdminTransactions({
      status: this.activeStatus() || undefined,
      page: this.page,
      size: 20,
    }).subscribe({
      next: (data) => {
        this.transactions.update(t => reset ? data.content : [...t, ...data.content]);
        this.totalElements.set(data.totalElements ?? data.content.length);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  protected txIconBg(status: string): string {
    const map: Record<string, string> = {
      INITIATED: 'bg-blue-50',   LOCKED: 'bg-indigo-50',
      SHIPPED: 'bg-amber-50',    DELIVERED: 'bg-cyan-50',
      RELEASED: 'bg-green-50',   DISPUTED: 'bg-red-50',
      CANCELLED: 'bg-slate-100', REFUNDED: 'bg-orange-50',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected txEmoji(status: string): string {
    const map: Record<string, string> = {
      INITIATED: '📋', LOCKED: '🔒', SHIPPED: '📦',
      DELIVERED: '✅', RELEASED: '💸', DISPUTED: '⚖️',
      CANCELLED: '❌', REFUNDED: '↩️',
    };
    return map[status] ?? '💳';
  }
}
