import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { injectAdminDashboardQuery, injectAdminDisputesQuery } from '../admin.queries';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TuiIcon } from '@taiga-ui/core';
import { AdminChartsComponent } from '../charts/admin-charts.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, StatusBadgeComponent, TimeAgoPipe, AmountPipe, TuiIcon, AdminChartsComponent],
  styles: [`
    .hero-bg {
      background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 55%, #0C1A2E 100%);
    }
    .glass-pill {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
    }
    .glow-red    { box-shadow: 0 0 24px rgba(220,38,38,.18); }
    .glow-indigo { box-shadow: 0 0 24px rgba(79,70,229,.18); }
    .glow-violet { box-shadow: 0 0 24px rgba(124,58,237,.18); }
    .glow-emerald{ box-shadow: 0 0 24px rgba(16,185,129,.18); }
    .card-red    { background: linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%); border-left: 3px solid #DC2626; }
    .card-indigo { background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%); border-left: 3px solid #4F46E5; }
    .card-violet { background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border-left: 3px solid #7C3AED; }
    .card-emerald{ background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%); border-left: 3px solid #10B981; }
    .queue-item:hover .queue-arrow { transform: translateX(3px); }
  `],
  template: `
    <div class="flex flex-col min-h-full" style="background: #F8FAFC">

      <!-- ════ HERO ════ -->
      <div class="hero-bg relative overflow-hidden">
        <div class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full"
             style="background: radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%)"></div>
        <div class="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full"
             style="background: radial-gradient(circle, rgba(52,211,153,.15) 0%, transparent 70%)"></div>

        <div class="relative px-4 md:px-8 pt-10 pb-6 max-w-5xl mx-auto">

          <!-- Hero body -->
          @if (isAdmin()) {
            @if (statsQuery.isPending()) {
              <div class="mb-6">
                <div class="skeleton-shimmer h-3 w-32 rounded mb-3 opacity-30"></div>
                <div class="skeleton-shimmer h-14 w-40 rounded mb-2 opacity-20"></div>
                <div class="skeleton-shimmer h-3 w-24 rounded opacity-20"></div>
              </div>
            } @else if (statsQuery.data(); as stats) {
              <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
                <div>
                  <p class="text-white/50 text-xs font-medium m-0 mb-1">{{ today }}</p>
                  <div class="flex items-baseline gap-3">
                    <span class="text-6xl font-black text-white leading-none">{{ stats.openDisputes }}</span>
                    <div>
                      <p class="text-white/80 text-sm font-semibold m-0">{{ 'admin.dashboard.openLabel' | translate }}</p>
                      <p class="text-white/40 text-xs m-0">{{ 'admin.dashboard.outOfTotal' | translate:{ total: stats.totalDisputes } }}</p>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center gap-3">
                    <div class="flex-1 h-1.5 rounded-full bg-white/10 max-w-48">
                      <div class="h-full rounded-full transition-all duration-1000"
                           style="background: linear-gradient(90deg, #34D399, #10B981)"
                           [style.width.%]="stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100) : 0">
                      </div>
                    </div>
                    <span class="text-white/50 text-[10px] font-medium">
                      {{ 'admin.dashboard.resolvedRate' | translate:{ rate: stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0') : 0 } }}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="glass-pill rounded-2xl px-4 py-3 min-w-[110px]">
                    <p class="text-white/50 text-[10px] uppercase tracking-wide m-0">{{ 'admin.dashboard.users' | translate }}</p>
                    <p class="text-white font-black text-xl m-0 leading-tight">{{ stats.activeUsers }}</p>
                    <p class="text-white/40 text-[10px] m-0">{{ stats.totalBuyers }}A · {{ stats.totalSellers }}V</p>
                  </div>
                  <div class="glass-pill rounded-2xl px-4 py-3 min-w-[110px]">
                    <p class="text-white/50 text-[10px] uppercase tracking-wide m-0">{{ 'admin.dashboard.transactions' | translate }}</p>
                    <p class="text-white font-black text-xl m-0 leading-tight">{{ stats.totalTransactions }}</p>
                    <p class="text-white/40 text-[10px] m-0">{{ stats.releasedTransactions }} {{ 'admin.dashboard.releasedSuffix' | translate }}</p>
                  </div>
                </div>
              </div>

              <!-- Dispute funnel strip -->
              <div class="grid grid-cols-4 gap-2">
                <div class="glass-pill rounded-xl px-3 py-2.5 text-center">
                  <p class="text-white/50 text-[9px] uppercase tracking-wide m-0 mb-0.5">{{ 'admin.dashboard.open' | translate }}</p>
                  <p class="text-red-400 font-black text-lg m-0 leading-none">{{ stats.openDisputes }}</p>
                </div>
                <div class="glass-pill rounded-xl px-3 py-2.5 text-center">
                  <p class="text-white/50 text-[9px] uppercase tracking-wide m-0 mb-0.5">{{ 'admin.dashboard.analysis' | translate }}</p>
                  <p class="text-indigo-400 font-black text-lg m-0 leading-none">{{ stats.underReviewDisputes }}</p>
                </div>
                <div class="glass-pill rounded-xl px-3 py-2.5 text-center">
                  <p class="text-white/50 text-[9px] uppercase tracking-wide m-0 mb-0.5">{{ 'admin.dashboard.arbitration' | translate }}</p>
                  <p class="text-violet-400 font-black text-lg m-0 leading-none">{{ stats.referredToArbitrationDisputes }}</p>
                </div>
                <div class="glass-pill rounded-xl px-3 py-2.5 text-center">
                  <p class="text-white/50 text-[9px] uppercase tracking-wide m-0 mb-0.5">{{ 'admin.dashboard.resolved' | translate }}</p>
                  <p class="text-emerald-400 font-black text-lg m-0 leading-none">{{ stats.resolvedDisputes }}</p>
                </div>
              </div>
            }
          } @else {
            <div class="mb-6">
              <p class="text-white/50 text-xs m-0 mb-1">{{ today }}</p>
              <h2 class="text-white font-black text-2xl m-0">{{ 'admin.dashboard.greeting' | translate:{ role: roleBadge() } }}</h2>
              <p class="text-white/40 text-sm m-0 mt-1">{{ 'admin.dashboard.greetingSub' | translate }}</p>
            </div>
          }

        </div>
      </div>

      <!-- ════ CONTENT ════ -->
      <div class="flex-1 px-4 md:px-8 py-6 pb-28 md:pb-10 max-w-5xl mx-auto w-full space-y-6">

        @if (isAdmin() && statsQuery.data(); as stats) {

          <!-- Volume highlight -->
          <div class="rounded-2xl overflow-hidden relative"
               style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)">
            <div class="pointer-events-none absolute right-0 top-0 w-40 h-40"
                 style="background: radial-gradient(circle at 80% 20%, rgba(52,211,153,.2) 0%, transparent 60%)"></div>
            <div class="relative px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p class="text-white/50 text-[11px] uppercase tracking-widest m-0">{{ 'admin.dashboard.volume' | translate }}</p>
                <p class="text-2xl font-black text-white m-0 mt-0.5 leading-tight">{{ +stats.totalVolumeReleased | amount }}</p>
                <p class="text-white/40 text-xs m-0 mt-1">
                  {{ 'admin.dashboard.volumeSub' | translate:{ released: stats.releasedTransactions, disputed: stats.disputedTransactions } }}
                </p>
              </div>
              <div class="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                   style="background: rgba(52,211,153,.15); border: 1px solid rgba(52,211,153,.3)">
                <tui-icon icon="@tui.trending-up" class="w-7 h-7" style="color: #34D399" />
              </div>
            </div>
          </div>

          <!-- Metric cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="card-red rounded-2xl p-4 glow-red">
              <div class="flex items-start justify-between mb-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100">
                  <tui-icon icon="@tui.triangle-alert" class="w-4 h-4" style="color: #DC2626" />
                </div>
                @if (stats.openDisputes > 0) {
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wide">
                    {{ 'admin.dashboard.urgentBadge' | translate }}
                  </span>
                }
              </div>
              <p class="text-3xl font-black m-0 leading-none" style="color: #DC2626">{{ stats.openDisputes }}</p>
              <p class="text-xs text-slate-500 m-0 mt-1 font-medium">{{ 'admin.dashboard.openDisputes' | translate }}</p>
            </div>

            <div class="card-indigo rounded-2xl p-4 glow-indigo">
              <div class="mb-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100">
                  <tui-icon icon="@tui.search" class="w-4 h-4" style="color: #4F46E5" />
                </div>
              </div>
              <p class="text-3xl font-black m-0 leading-none" style="color: #4F46E5">{{ stats.underReviewDisputes }}</p>
              <p class="text-xs text-slate-500 m-0 mt-1 font-medium">{{ 'admin.dashboard.underReview' | translate }}</p>
            </div>

            <div class="card-violet rounded-2xl p-4 glow-violet">
              <div class="mb-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-100">
                  <tui-icon icon="@tui.scale" class="w-4 h-4" style="color: #7C3AED" />
                </div>
              </div>
              <p class="text-3xl font-black m-0 leading-none" style="color: #7C3AED">{{ stats.referredToArbitrationDisputes }}</p>
              <p class="text-xs text-slate-500 m-0 mt-1 font-medium">{{ 'admin.dashboard.arbitration' | translate }}</p>
            </div>

            <div class="card-emerald rounded-2xl p-4 glow-emerald">
              <div class="mb-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100">
                  <tui-icon icon="@tui.check-circle" class="w-4 h-4" style="color: #10B981" />
                </div>
              </div>
              <p class="text-3xl font-black m-0 leading-none" style="color: #10B981">{{ stats.resolvedDisputes }}</p>
              <p class="text-xs text-slate-500 m-0 mt-1 font-medium">{{ 'admin.dashboard.resolved' | translate }}</p>
            </div>
          </div>

          <!-- Charts -->
          <app-admin-charts [stats]="stats" />

        }

        <!-- Dispute Queue -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-black text-slate-900 m-0">
                {{ (isAdmin() ? 'admin.dashboard.allDisputes' : 'admin.dashboard.myQueue') | translate }}
              </h2>
              @if (!disputesQuery.isPending()) {
                <p class="text-xs text-slate-400 m-0 mt-0.5">
                  {{ 'admin.dashboard.queueCount' | translate:{ count: disputes().length } }}
                </p>
              }
            </div>
            <a routerLink="/admin/disputes"
               class="flex items-center gap-1.5 text-xs font-bold no-underline px-3 py-1.5 rounded-xl transition-colors hover:bg-slate-100"
               style="color: var(--color-primary)">
              {{ 'admin.dashboard.seeAll' | translate }}
              <tui-icon icon="@tui.arrow-right" class="w-3.5 h-3.5" />
            </a>
          </div>

          @if (disputesQuery.isPending()) {
            <div class="flex flex-col gap-2">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-2xl p-4 flex items-center gap-3"
                     style="box-shadow: 0 1px 3px rgba(15,34,64,.06)">
                  <div class="skeleton-shimmer w-10 h-10 rounded-xl shrink-0"></div>
                  <div class="flex-1">
                    <div class="skeleton-shimmer h-3 w-2/5 rounded mb-2"></div>
                    <div class="skeleton-shimmer h-2.5 w-3/5 rounded"></div>
                  </div>
                  <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>
                </div>
              }
            </div>

          } @else if (disputes().length === 0) {
            <div class="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
              <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <tui-icon icon="@tui.check-circle" class="w-6 h-6" style="color: #10B981" />
              </div>
              <p class="text-sm font-bold text-slate-800 m-0">{{ 'admin.dashboard.queueEmpty' | translate }}</p>
              <p class="text-xs text-slate-400 m-0 mt-1">{{ 'admin.dashboard.queueEmptySub' | translate }}</p>
            </div>

          } @else {
            <div class="flex flex-col gap-2">
              @for (d of disputes(); track d.id) {
                <a [routerLink]="['/admin/disputes', d.id]"
                   class="queue-item group flex items-center gap-3 bg-white rounded-2xl px-4 py-3 no-underline transition-all hover:shadow-md"
                   style="box-shadow: 0 1px 3px rgba(15,34,64,.06)">

                  <div class="relative shrink-0">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                         [class]="disputeIconBg(d.status)">
                      <tui-icon [icon]="disputeIcon(d.status)" class="w-[17px] h-[17px]"
                                [style.color]="disputeIconColor(d.status)" />
                    </div>
                    @if (d.status === 'OPENED') {
                      <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                    }
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                    <p class="text-xs text-slate-400 m-0 truncate">
                      {{ d.buyerName ?? '—' }} · {{ d.sellerName ?? '—' }}
                      @if (d.grossAmount) {
                        · <span class="font-semibold text-slate-600">{{ d.grossAmount | amount }}</span>
                      }
                    </p>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <div class="flex flex-col items-end gap-1">
                      <app-status-badge [status]="d.status" />
                      <span class="text-[9px] text-slate-400">{{ d.createdAt | timeAgo }}</span>
                    </div>
                    <tui-icon icon="@tui.chevron-right"
                              class="queue-arrow w-4 h-4 text-slate-300 transition-transform" />
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
export class AdminDashboardComponent {
  private readonly auth = inject(AuthStore);

  protected readonly isAdminFlag = computed(() => this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR');
  protected readonly statsQuery = injectAdminDashboardQuery(() => this.isAdminFlag());
  protected readonly disputesQuery = injectAdminDisputesQuery(() => ({
    isAdmin: this.isAdminFlag(),
    unassigned: false,
    page: 0,
    size: 20,
  }));

  protected readonly disputes = computed(() => this.disputesQuery.data()?.content ?? []);

  protected readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date());

  protected isAdmin() { return this.isAdminFlag(); }

  protected roleBadge(): string {
    return this.auth.isAdmin() ? 'Admin' : this.auth.role() === 'SUPERVISOR' ? 'Superviseur' : 'Support';
  }

  protected disputeIconBg(status: string): string {
    const map: Record<string, string> = {
      OPENED: 'bg-red-50', UNDER_REVIEW: 'bg-indigo-50',
      AWAITING_BUYER: 'bg-amber-50', AWAITING_SELLER: 'bg-amber-50',
      AWAITING_ARBITRATION_PAYMENT: 'bg-orange-50',
      REFERRED_TO_ARBITRATION: 'bg-violet-50',
      RESOLVED_BUYER: 'bg-emerald-50', RESOLVED_SELLER: 'bg-emerald-50',
      RESOLVED_SPLIT: 'bg-emerald-50', CLOSED_NO_ACTION: 'bg-slate-100',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected disputeIcon(status: string): string {
    const map: Record<string, string> = {
      OPENED: '@tui.triangle-alert', UNDER_REVIEW: '@tui.search',
      AWAITING_BUYER: '@tui.clock', AWAITING_SELLER: '@tui.clock',
      AWAITING_ARBITRATION_PAYMENT: '@tui.scale',
      REFERRED_TO_ARBITRATION: '@tui.landmark',
      RESOLVED_BUYER: '@tui.check-circle', RESOLVED_SELLER: '@tui.check-circle',
      RESOLVED_SPLIT: '@tui.handshake', CLOSED_NO_ACTION: '@tui.folder',
    };
    return map[status] ?? '@tui.circle';
  }

  protected disputeIconColor(status: string): string {
    const map: Record<string, string> = {
      OPENED: '#DC2626', UNDER_REVIEW: '#4F46E5',
      AWAITING_BUYER: '#D97706', AWAITING_SELLER: '#D97706',
      AWAITING_ARBITRATION_PAYMENT: '#EA580C',
      REFERRED_TO_ARBITRATION: '#7C3AED',
      RESOLVED_BUYER: '#10B981', RESOLVED_SELLER: '#10B981',
      RESOLVED_SPLIT: '#10B981', CLOSED_NO_ACTION: '#64748B',
    };
    return map[status] ?? '#64748B';
  }
}
