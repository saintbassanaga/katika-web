import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AdminService, AdminDashboardStats } from '../admin.service';
import { DisputeResponse } from '@features/disputes/dispute.service';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, TimeAgoPipe, AmountPipe, TranslatePipe],
  template: `
    <div class="flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/dashboard"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-white m-0">{{ 'admin.title' | translate }}</h1>
          <p class="text-xs text-white/50 m-0">{{ roleBadge() }}</p>
        </div>
        <!-- Disputes link -->
        <a routerLink="/admin/disputes"
           class="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs font-semibold no-underline hover:bg-white/20 transition-colors">
          {{ 'admin.dashboard.allDisputes' | translate }}
        </a>
      </div>

      <div class="flex-1 px-4 md:px-8 py-4 pb-24 md:pb-8 max-w-5xl mx-auto w-full space-y-5">

        <!-- ADMIN-ONLY: KPI stats grid -->
        @if (isAdmin()) {
          @if (loadingStats()) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <div class="skeleton-shimmer h-3 w-1/2 rounded mb-2"></div>
                  <div class="skeleton-shimmer h-7 w-2/3 rounded"></div>
                </div>
              }
            </div>
          } @else if (stats()) {
            <!-- Dispute stats -->
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{{ 'admin.dashboard.disputes' | translate }}</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.open' | translate }}</p>
                  <p class="text-2xl font-extrabold text-error m-0">{{ stats()!.openDisputes }}</p>
                  <p class="text-xs text-slate-400 m-0">/ {{ stats()!.totalDisputes }} total</p>
                </div>
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.underReview' | translate }}</p>
                  <p class="text-2xl font-extrabold text-indigo-600 m-0">{{ stats()!.underReviewDisputes }}</p>
                </div>
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.arbitration' | translate }}</p>
                  <p class="text-2xl font-extrabold text-violet-600 m-0">{{ stats()!.referredToArbitrationDisputes }}</p>
                </div>
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.resolved' | translate }}</p>
                  <p class="text-2xl font-extrabold text-success m-0">{{ stats()!.resolvedDisputes }}</p>
                </div>
              </div>
            </div>

            <!-- User + transaction stats -->
            <div>
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{{ 'admin.dashboard.users' | translate }} &amp; {{ 'admin.dashboard.transactions' | translate }}</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.activeUsers' | translate }}</p>
                  <p class="text-2xl font-extrabold text-primary m-0">{{ stats()!.activeUsers }}</p>
                  <p class="text-xs text-slate-400 m-0">{{ stats()!.totalBuyers }}b · {{ stats()!.totalSellers }}v · {{ stats()!.totalStaff }}s</p>
                </div>
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.transactions' | translate }}</p>
                  <p class="text-2xl font-extrabold text-slate-900 m-0">{{ stats()!.totalTransactions }}</p>
                  <p class="text-xs text-slate-400 m-0">{{ stats()!.lockedTransactions }} bloquées</p>
                </div>
                <div class="bg-white rounded-2xl p-4 shadow-sm md:col-span-2">
                  <p class="text-xs text-slate-500 m-0">{{ 'admin.dashboard.volume' | translate }}</p>
                  <p class="text-2xl font-extrabold text-slate-900 m-0">{{ +stats()!.totalVolumeReleased | amount }}</p>
                  <p class="text-xs text-slate-400 m-0">{{ stats()!.releasedTransactions }} tx libérées</p>
                </div>
              </div>
            </div>
          }
        }

        <!-- Dispute queue -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-bold text-slate-500 uppercase tracking-wide m-0">
              {{ isAdmin() ? ('admin.dashboard.allDisputes' | translate) : ('admin.dashboard.myQueue' | translate) }}
            </p>
            <a routerLink="/admin/disputes" class="text-xs font-semibold text-primary no-underline hover:underline">
              {{ 'dashboard.viewAll' | translate }}
            </a>
          </div>

          @if (loadingDisputes()) {
            <div class="flex flex-col gap-2">
              @for (i of [1,2,3]; track i) {
                <div class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div class="skeleton-shimmer w-11 h-11 rounded-[14px] shrink-0"></div>
                  <div class="flex-1">
                    <div class="skeleton-shimmer h-3 w-2/5 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-2.5 w-3/5 rounded"></div>
                  </div>
                  <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>
                </div>
              }
            </div>
          } @else if (disputes().length === 0) {
            <div class="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div class="text-3xl mb-2">✅</div>
              <p class="text-sm font-bold text-slate-900 m-0">{{ 'admin.dashboard.noDisputes' | translate }}</p>
              <p class="text-xs text-slate-400 m-0 mt-1">{{ 'admin.dashboard.noDisputesSub' | translate }}</p>
            </div>
          } @else {
            <div class="flex flex-col gap-2">
              @for (d of disputes(); track d.id) {
                <a
                  [routerLink]="['/admin/disputes', d.id]"
                  class="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 no-underline shadow-[0_1px_4px_rgba(15,23,42,.06)] transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,.1)] hover:-translate-y-px"
                >
                  <!-- Status icon -->
                  <div class="w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center text-xl"
                       [class]="disputeIconBg(d.status)">
                    {{ disputeEmoji(d.status) }}
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                    </div>
                    <p class="text-xs text-slate-500 m-0 truncate">
                      {{ d.buyerName ?? '—' }} &amp; {{ d.sellerName ?? '—' }}
                    </p>
                    <p class="text-[11px] text-slate-400 m-0 mt-0.5">{{ d.createdAt | timeAgo }}</p>
                  </div>

                  <!-- Status + chevron -->
                  <div class="flex items-center gap-2 shrink-0">
                    <app-status-badge [status]="d.status" />
                    <svg class="text-slate-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auth         = inject(AuthStore);

  protected readonly stats           = signal<AdminDashboardStats | null>(null);
  protected readonly disputes        = signal<DisputeResponse[]>([]);
  protected readonly loadingStats    = signal(true);
  protected readonly loadingDisputes = signal(true);

  protected isAdmin() { return this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR'; }

  protected roleBadge(): string {
    return this.auth.isAdmin() ? 'Admin' : this.auth.role() === 'SUPERVISOR' ? 'Superviseur' : 'Support';
  }

  ngOnInit(): void {
    const isAdmin = this.isAdmin();

    // Load dispute queue
    this.adminService.getDisputes({ isAdmin, unassigned: false, page: 0, size: 20 }).subscribe({
      next: (data) => { this.disputes.set(data.content); this.loadingDisputes.set(false); },
      error: () => this.loadingDisputes.set(false),
    });

    // Load stats (admin only)
    if (isAdmin) {
      this.adminService.getDashboard().subscribe({
        next: (s) => { this.stats.set(s); this.loadingStats.set(false); },
        error: () => this.loadingStats.set(false),
      });
    } else {
      this.loadingStats.set(false);
    }
  }

  protected disputeIconBg(status: string): string {
    const map: Record<string, string> = {
      OPENED: 'bg-red-50', UNDER_REVIEW: 'bg-indigo-50',
      AWAITING_BUYER: 'bg-amber-50', AWAITING_SELLER: 'bg-amber-50',
      AWAITING_ARBITRATION_PAYMENT: 'bg-orange-50', REFERRED_TO_ARBITRATION: 'bg-violet-50',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected disputeEmoji(status: string): string {
    const map: Record<string, string> = {
      OPENED: '🔴', UNDER_REVIEW: '🔍',
      AWAITING_BUYER: '⏳', AWAITING_SELLER: '⏳',
      AWAITING_ARBITRATION_PAYMENT: '⚖️', REFERRED_TO_ARBITRATION: '🏛️',
      RESOLVED_BUYER: '✅', RESOLVED_SELLER: '✅',
    };
    return map[status] ?? '⚖️';
  }
}
