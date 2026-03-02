import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { DisputeResponse } from '@features/disputes/dispute.service';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';

const FILTERS = [
  { value: '',                           labelKey: 'disputes.filters.all' },
  { value: 'OPENED',                     labelKey: 'disputes.filters.open' },
  { value: 'UNDER_REVIEW',              labelKey: 'disputes.filters.inProgress' },
  { value: 'AWAITING_ARBITRATION_PAYMENT', labelKey: 'disputes.filters.arbitration' },
];

@Component({
  selector: 'app-admin-dispute-list',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, TimeAgoPipe, TranslatePipe],
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
          <h1 class="text-sm font-bold text-white m-0">{{ 'admin.title' | translate }}</h1>
          @if (!loading()) {
            <p class="text-xs text-white/50 m-0">{{ disputes().length }} litige(s)</p>
          }
        </div>
        <!-- Unassigned toggle (support only) -->
        @if (!isAdmin()) {
          <button
            (click)="toggleUnassigned()"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            [class]="showUnassigned()
              ? 'bg-white text-primary border-white'
              : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'"
          >
            {{ 'admin.dashboard.unassigned' | translate }}
          </button>
        }
      </div>

      <!-- Filter chips -->
      <div class="px-4 md:px-8 pt-3 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
        @for (f of filters; track f.value) {
          <button
            (click)="setFilter(f.value)"
            class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all whitespace-nowrap"
            [class]="activeFilter() === f.value
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'"
          >{{ f.labelKey | translate }}</button>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 px-4 md:px-8 py-3 pb-24 md:pb-8 max-w-3xl mx-auto w-full">

        @if (loading()) {
          <div class="flex flex-col gap-2.5">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div class="skeleton-shimmer w-11 h-11 rounded-[14px] shrink-0"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="skeleton-shimmer h-3 w-2/5 rounded"></div>
                  <div class="skeleton-shimmer h-2.5 w-3/5 rounded"></div>
                </div>
                <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>
              </div>
            }
          </div>
        } @else if (disputes().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-2xl bg-success-lt flex items-center justify-center text-3xl mb-4">✅</div>
            <p class="text-base font-bold text-slate-900 m-0 mb-1">{{ 'admin.dashboard.noDisputes' | translate }}</p>
            <p class="text-sm text-slate-400 m-0">{{ 'admin.dashboard.noDisputesSub' | translate }}</p>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            @for (d of disputes(); track d.id) {
              <a
                [routerLink]="['/admin/disputes', d.id]"
                class="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 no-underline shadow-[0_1px_4px_rgba(15,23,42,.06)] transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,.1)] hover:-translate-y-px"
              >
                <div class="w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center text-xl"
                     [class]="iconBg(d.status)">{{ emoji(d.status) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5 truncate">
                    {{ d.buyerName ?? '—' }} &amp; {{ d.sellerName ?? '—' }}
                  </p>
                  <p class="text-[11px] text-slate-400 m-0 mt-0.5">{{ d.createdAt | timeAgo }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <app-status-badge [status]="d.status" />
                  <svg class="text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </a>
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
export class AdminDisputeListComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auth         = inject(AuthStore);

  protected readonly disputes     = signal<DisputeResponse[]>([]);
  protected readonly loading      = signal(true);
  protected readonly loadingMore  = signal(false);
  protected readonly hasMore      = signal(false);
  protected readonly activeFilter = signal('');
  protected readonly showUnassigned = signal(false);

  protected readonly filters = FILTERS;
  protected isAdmin() { return this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR'; }

  private page = 0;

  ngOnInit(): void { this.load(); }

  protected setFilter(value: string): void {
    this.activeFilter.set(value);
    this.page = 0;
    this.disputes.set([]);
    this.load();
  }

  protected toggleUnassigned(): void {
    this.showUnassigned.update(v => !v);
    this.page = 0;
    this.disputes.set([]);
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
    this.adminService.getDisputes({
      isAdmin: this.isAdmin(),
      unassigned: this.showUnassigned(),
      status: this.activeFilter() || undefined,
      page: this.page,
      size: 20,
    }).subscribe({
      next: (data) => {
        this.disputes.update(d => reset ? data.content : [...d, ...data.content]);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  protected iconBg(status: string): string {
    const map: Record<string, string> = {
      OPENED: 'bg-red-50', UNDER_REVIEW: 'bg-indigo-50',
      AWAITING_BUYER: 'bg-amber-50', AWAITING_SELLER: 'bg-amber-50',
      AWAITING_ARBITRATION_PAYMENT: 'bg-orange-50', REFERRED_TO_ARBITRATION: 'bg-violet-50',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected emoji(status: string): string {
    const map: Record<string, string> = {
      OPENED: '🔴', UNDER_REVIEW: '🔍', AWAITING_BUYER: '⏳',
      AWAITING_SELLER: '⏳', AWAITING_ARBITRATION_PAYMENT: '⚖️',
      REFERRED_TO_ARBITRATION: '🏛️', RESOLVED_BUYER: '✅', RESOLVED_SELLER: '✅',
    };
    return map[status] ?? '⚖️';
  }
}
