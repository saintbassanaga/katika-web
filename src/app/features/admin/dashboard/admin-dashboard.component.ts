import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
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
    <div class="animate-fade flex flex-col min-h-full bg-page">

      <!-- ── Header ── -->
      <div class="sticky top-0 z-20 bg-dark px-4 md:px-8 py-3 flex items-center gap-3"
           style="box-shadow: 0 2px 20px rgba(15,34,64,.45)">
        <a routerLink="/dashboard"
           class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/70 no-underline shrink-0 hover:bg-white/20 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-extrabold text-white m-0 tracking-tight">{{ 'admin.title' | translate }}</h1>
          <p class="text-[11px] text-white/40 m-0">{{ roleBadge() }}</p>
        </div>
        <div class="flex items-center gap-2">
          @if (isAdmin()) {
            <a routerLink="/admin/users"
               class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs font-medium no-underline hover:bg-white/15 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              {{ 'admin.users.title' | translate }}
            </a>
            <a routerLink="/admin/transactions"
               class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 text-white/70 text-xs font-medium no-underline hover:bg-white/15 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              {{ 'admin.transactions.title' | translate }}
            </a>
          }
          <a routerLink="/admin/disputes"
             class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline transition-colors"
             style="background: var(--color-primary); color: #fff">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {{ 'admin.dashboard.allDisputes' | translate }}
          </a>
        </div>
      </div>

      <div class="flex-1 px-4 md:px-8 py-5 pb-24 md:pb-10 max-w-5xl mx-auto w-full space-y-6">

        <!-- ── ADMIN: Stats Grid ── -->
        @if (isAdmin()) {
          @if (loadingStats()) {
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-2xl p-4 shadow-sm">
                  <div class="skeleton-shimmer h-2.5 w-1/2 rounded mb-3"></div>
                  <div class="skeleton-shimmer h-8 w-2/3 rounded mb-1"></div>
                  <div class="skeleton-shimmer h-2 w-1/3 rounded"></div>
                </div>
              }
            </div>
          } @else if (stats()) {

            <!-- Dispute KPIs -->
            <section>
              <div class="flex items-center justify-between mb-3">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest m-0">{{ 'admin.dashboard.disputes' | translate }}</p>
                <span class="text-[10px] text-slate-400 font-medium">{{ stats()!.totalDisputes }} total</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

                <!-- Open -->
                <div class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-red-100">
                  <div class="absolute top-0 right-0 w-16 h-16 rounded-full bg-red-50 -translate-y-4 translate-x-4"></div>
                  <div class="relative">
                    <div class="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mb-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.open' | translate }}</p>
                    <p class="text-2xl font-black text-error m-0 leading-tight">{{ stats()!.openDisputes }}</p>
                    <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                      {{ stats()!.openDisputes > 0 ? 'action requise' : 'aucun en attente' }}
                    </p>
                  </div>
                </div>

                <!-- Under Review -->
                <div class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
                  <div class="absolute top-0 right-0 w-16 h-16 rounded-full bg-indigo-50 -translate-y-4 translate-x-4"></div>
                  <div class="relative">
                    <div class="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center mb-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                    <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.underReview' | translate }}</p>
                    <p class="text-2xl font-black text-indigo-600 m-0 leading-tight">{{ stats()!.underReviewDisputes }}</p>
                    <p class="text-[10px] text-slate-400 m-0 mt-0.5">en cours d'analyse</p>
                  </div>
                </div>

                <!-- Arbitration -->
                <div class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-violet-100">
                  <div class="absolute top-0 right-0 w-16 h-16 rounded-full bg-violet-50 -translate-y-4 translate-x-4"></div>
                  <div class="relative">
                    <div class="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center mb-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.arbitration' | translate }}</p>
                    <p class="text-2xl font-black text-violet-600 m-0 leading-tight">{{ stats()!.referredToArbitrationDisputes }}</p>
                    <p class="text-[10px] text-slate-400 m-0 mt-0.5">en arbitrage</p>
                  </div>
                </div>

                <!-- Resolved -->
                <div class="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                  <div class="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-50 -translate-y-4 translate-x-4"></div>
                  <div class="relative">
                    <div class="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.resolved' | translate }}</p>
                    <p class="text-2xl font-black text-success m-0 leading-tight">{{ stats()!.resolvedDisputes }}</p>
                    <p class="text-[10px] text-slate-400 m-0 mt-0.5">clôturés avec succès</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Users & Transactions -->
            <section>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 m-0">
                {{ 'admin.dashboard.users' | translate }} &amp; {{ 'admin.dashboard.transactions' | translate }}
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

                <!-- Active users -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
                         style="background: var(--color-primary-lt)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.activeUsers' | translate }}</p>
                      <p class="text-xl font-black text-primary m-0 leading-tight">{{ stats()!.activeUsers }}</p>
                      <div class="flex items-center gap-2 mt-1.5">
                        <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-primary-lt text-primary font-semibold">
                          {{ stats()!.totalBuyers }}A
                        </span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-success-lt text-success font-semibold">
                          {{ stats()!.totalSellers }}V
                        </span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                          {{ stats()!.totalStaff }}S
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Transactions -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-gold-lt">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9920D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.transactions' | translate }}</p>
                      <p class="text-xl font-black text-slate-900 m-0 leading-tight">{{ stats()!.totalTransactions }}</p>
                      <p class="text-[10px] text-slate-400 m-0 mt-1">
                        {{ stats()!.lockedTransactions }} bloquées · {{ stats()!.disputedTransactions }} litigieuses
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Volume Released -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100"
                     style="background: linear-gradient(135deg, #fff 70%, #ecfdf5)">
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-success-lt">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[11px] text-slate-500 m-0">{{ 'admin.dashboard.volume' | translate }}</p>
                      <p class="text-xl font-black text-success m-0 leading-tight">{{ +stats()!.totalVolumeReleased | amount }}</p>
                      <p class="text-[10px] text-slate-400 m-0 mt-1">{{ stats()!.releasedTransactions }} tx libérées</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          }
        }

        <!-- ── Dispute Queue ── -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest m-0">
                {{ isAdmin() ? ('admin.dashboard.allDisputes' | translate) : ('admin.dashboard.myQueue' | translate) }}
              </p>
            </div>
            <a routerLink="/admin/disputes"
               class="flex items-center gap-1 text-xs font-semibold no-underline hover:underline"
               style="color: var(--color-primary)">
              {{ 'dashboard.viewAll' | translate }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>
          </div>

          @if (loadingDisputes()) {
            <div class="flex flex-col gap-2.5">
              @for (i of [1,2,3]; track i) {
                <div class="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div class="skeleton-shimmer w-11 h-11 rounded-xl shrink-0"></div>
                  <div class="flex-1">
                    <div class="skeleton-shimmer h-3 w-2/5 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-2.5 w-3/5 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-2 w-1/4 rounded"></div>
                  </div>
                  <div class="skeleton-shimmer h-6 w-24 rounded-full"></div>
                </div>
              }
            </div>
          } @else if (disputes().length === 0) {
            <div class="bg-white rounded-2xl p-10 shadow-sm text-center border border-dashed border-slate-200">
              <div class="w-12 h-12 rounded-2xl bg-success-lt flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <p class="text-sm font-bold text-slate-900 m-0">{{ 'admin.dashboard.noDisputes' | translate }}</p>
              <p class="text-xs text-slate-400 m-0 mt-1">{{ 'admin.dashboard.noDisputesSub' | translate }}</p>
            </div>
          } @else {
            <div class="flex flex-col gap-2">
              @for (d of disputes(); track d.id) {
                <a
                  [routerLink]="['/admin/disputes', d.id]"
                  class="group flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 no-underline border border-transparent transition-all hover:border-slate-200 hover:shadow-md"
                  style="box-shadow: 0 1px 4px rgba(15,34,64,.06)"
                >
                  <!-- Status icon -->
                  <div class="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
                       [class]="disputeIconBg(d.status)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="disputeIconColor(d.status)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="disputeIconPath(d.status)"/>
                    </svg>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                    </div>
                    <p class="text-xs text-slate-500 m-0 truncate">
                      {{ d.buyerName ?? '—' }} &amp; {{ d.sellerName ?? '—' }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      @if (d.grossAmount) {
                        <span class="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {{ d.grossAmount | amount }}
                        </span>
                      }
                      <span class="text-[10px] text-slate-400">{{ d.createdAt | timeAgo }}</span>
                    </div>
                  </div>

                  <!-- Status + chevron -->
                  <div class="flex items-center gap-2 shrink-0">
                    <app-status-badge [status]="d.status" />
                    <svg class="text-slate-300 transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </a>
              }
            </div>
          }
        </section>

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

    this.adminService.getDisputes({ isAdmin, unassigned: false, page: 0, size: 20 }).subscribe({
      next: (data) => { this.disputes.set(data.content); this.loadingDisputes.set(false); },
      error: () => this.loadingDisputes.set(false),
    });

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
      OPENED: 'bg-red-50',
      UNDER_REVIEW: 'bg-indigo-50',
      AWAITING_BUYER: 'bg-amber-50',
      AWAITING_SELLER: 'bg-amber-50',
      AWAITING_ARBITRATION_PAYMENT: 'bg-orange-50',
      REFERRED_TO_ARBITRATION: 'bg-violet-50',
      RESOLVED_BUYER: 'bg-emerald-50',
      RESOLVED_SELLER: 'bg-emerald-50',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected disputeIconColor(status: string): string {
    const map: Record<string, string> = {
      OPENED: '#DC2626',
      UNDER_REVIEW: '#4F46E5',
      AWAITING_BUYER: '#D97706',
      AWAITING_SELLER: '#D97706',
      AWAITING_ARBITRATION_PAYMENT: '#EA580C',
      REFERRED_TO_ARBITRATION: '#7C3AED',
      RESOLVED_BUYER: '#10B981',
      RESOLVED_SELLER: '#10B981',
    };
    return map[status] ?? '#64748B';
  }

  protected disputeIconPath(status: string): string {
    if (status === 'OPENED') return 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z';
    if (status === 'UNDER_REVIEW') return 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7';
    if (status.startsWith('AWAITING')) return 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83';
    if (status === 'REFERRED_TO_ARBITRATION') return 'M3 6l3 1m0 0-3 9a5 5 0 0 0 6.996 4.34M6 7l3-2M6 7v13m6-13.5V19m6-12.5V19m-6-6h6m-6 0H6m12 0-3-9a5 5 0 0 0-6.996 4.34M18 7l-3-2M18 7v13';
    if (status.startsWith('RESOLVED') || status.startsWith('CLOSED')) return 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3';
    return 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z';
  }
}
