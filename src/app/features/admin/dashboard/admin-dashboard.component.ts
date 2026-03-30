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
    .kpi-card { background: #fff; border-radius: 16px; box-shadow: 0 1px 4px rgba(15,34,64,.08); padding: 20px; }
    .queue-item:hover .queue-arrow { transform: translateX(3px); }
  `],
  template: `
    <div class="p-6 space-y-5" style="background: #F8FAFC; min-height: 100vh">

      @if (isAdmin() && statsQuery.data(); as stats) {

        <!-- ── Row 1: 4 Dispute KPI Cards ── -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">

          <!-- Open Disputes -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.triangle-alert" style="width:16px;height:16px;color:#DC2626" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.openDisputes' | translate }}</span>
              </div>
              @if (stats.openDisputes > 0) {
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEF2F2;color:#DC2626;white-space:nowrap">
                  {{ 'admin.dashboard.urgentBadge' | translate }}
                </span>
              }
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.openDisputes }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ 'admin.dashboard.outOfTotal' | translate:{ total: stats.totalDisputes } }}</p>
          </div>

          <!-- Under Review -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.search" style="width:16px;height:16px;color:#4F46E5" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.underReview' | translate }}</span>
              </div>
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.underReviewDisputes }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ 'admin.dashboard.analysis' | translate }}</p>
          </div>

          <!-- Arbitration -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#F5F3FF;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.scale" style="width:16px;height:16px;color:#7C3AED" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.arbitration' | translate }}</span>
              </div>
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.referredToArbitrationDisputes }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ 'admin.dashboard.arbitration' | translate }}</p>
          </div>

          <!-- Resolved -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#ECFDF5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.check-circle" style="width:16px;height:16px;color:#10B981" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.resolved' | translate }}</span>
              </div>
              @if (stats.totalDisputes > 0) {
                <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#ECFDF5;color:#10B981;white-space:nowrap">
                  + {{ stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0') : 0 }}%
                </span>
              }
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.resolvedDisputes }}</p>
            <p style="font-size:11px;color:#10B981;font-weight:600;margin:8px 0 0">{{ 'admin.dashboard.resolvedRate' | translate:{ rate: stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0') : 0 } }}</p>
          </div>

        </div>

        <!-- ── Row 2: 3 Secondary KPI Cards ── -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">

          <!-- Volume Released -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#ECFDF5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.trending-up" style="width:16px;height:16px;color:#10B981" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.volume' | translate }}</span>
              </div>
            </div>
            <p style="font-size:24px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ +stats.totalVolumeReleased | amount }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ 'admin.dashboard.volumeSub' | translate:{ released: stats.releasedTransactions, disputed: stats.disputedTransactions } }}</p>
          </div>

          <!-- Active Users -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.users" style="width:16px;height:16px;color:#3B82F6" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.users' | translate }}</span>
              </div>
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.activeUsers }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ stats.totalBuyers }}A · {{ stats.totalSellers }}V</p>
          </div>

          <!-- Transactions -->
          <div class="kpi-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:32px;height:32px;border-radius:10px;background:#EEF2FF;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <tui-icon icon="@tui.arrow-left-right" style="width:16px;height:16px;color:#6366F1" />
                </div>
                <span style="font-size:11px;font-weight:600;color:#64748B">{{ 'admin.dashboard.transactions' | translate }}</span>
              </div>
            </div>
            <p style="font-size:38px;font-weight:900;color:#0F172A;margin:0;line-height:1">{{ stats.totalTransactions }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:8px 0 0">{{ stats.releasedTransactions }} {{ 'admin.dashboard.releasedSuffix' | translate }}</p>
          </div>

        </div>

        <!-- ── Row 3: Charts ── -->
        <app-admin-charts [stats]="stats" />

      }

      <!-- ── Dispute Queue ── -->
      <div class="kpi-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <h2 style="font-size:13px;font-weight:900;color:#0F172A;margin:0">
              {{ (isAdmin() ? 'admin.dashboard.allDisputes' : 'admin.dashboard.myQueue') | translate }}
            </h2>
            @if (!disputesQuery.isPending()) {
              <p style="font-size:11px;color:#94A3B8;margin:3px 0 0">
                {{ 'admin.dashboard.queueCount' | translate:{ count: disputes().length } }}
              </p>
            }
          </div>
          <a routerLink="/admin/disputes"
             style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-decoration:none;padding:6px 12px;border-radius:10px;color:var(--color-primary);transition:background .15s"
             class="hover:bg-slate-100">
            {{ 'admin.dashboard.seeAll' | translate }}
            <tui-icon icon="@tui.arrow-right" style="width:14px;height:14px" />
          </a>
        </div>

        @if (disputesQuery.isPending()) {
          <div style="display:flex;flex-direction:column;gap:8px">
            @for (i of [1,2,3,4]; track i) {
              <div style="border-radius:12px;padding:12px;display:flex;align-items:center;gap:12px;background:#F8FAFC">
                <div class="skeleton-shimmer" style="width:36px;height:36px;border-radius:10px;flex-shrink:0"></div>
                <div style="flex:1">
                  <div class="skeleton-shimmer" style="height:11px;width:40%;border-radius:6px;margin-bottom:8px"></div>
                  <div class="skeleton-shimmer" style="height:10px;width:60%;border-radius:6px"></div>
                </div>
                <div class="skeleton-shimmer" style="height:20px;width:80px;border-radius:20px"></div>
              </div>
            }
          </div>

        } @else if (disputes().length === 0) {
          <div style="border-radius:12px;border:2px dashed #E2E8F0;padding:40px;text-align:center">
            <div style="width:40px;height:40px;border-radius:12px;background:#ECFDF5;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
              <tui-icon icon="@tui.check-circle" style="width:20px;height:20px;color:#10B981" />
            </div>
            <p style="font-size:13px;font-weight:700;color:#1E293B;margin:0">{{ 'admin.dashboard.queueEmpty' | translate }}</p>
            <p style="font-size:11px;color:#94A3B8;margin:4px 0 0">{{ 'admin.dashboard.queueEmptySub' | translate }}</p>
          </div>

        } @else {
          <div style="display:flex;flex-direction:column;gap:4px">
            @for (d of disputes(); track d.id) {
              <a [routerLink]="['/admin/disputes', d.id]"
                 class="queue-item"
                 style="display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:12px;text-decoration:none;transition:background .15s;cursor:pointer"
                 class="hover:bg-slate-50">

                <div style="position:relative;flex-shrink:0">
                  <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center"
                       [class]="disputeIconBg(d.status)">
                    <tui-icon [icon]="disputeIcon(d.status)" style="width:16px;height:16px"
                              [style.color]="disputeIconColor(d.status)" />
                  </div>
                  @if (d.status === 'OPENED') {
                    <span style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#DC2626;border:2px solid #fff"></span>
                  }
                </div>

                <div style="flex:1;min-width:0">
                  <p style="font-size:13px;font-weight:700;color:#0F172A;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ d.reference }}</p>
                  <p style="font-size:11px;color:#94A3B8;margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ d.buyerName ?? '—' }} · {{ d.sellerName ?? '—' }}
                    @if (d.grossAmount) {
                      · <span style="font-weight:600;color:#475569">{{ d.grossAmount | amount }}</span>
                    }
                  </p>
                </div>

                <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                    <app-status-badge [status]="d.status" />
                    <span style="font-size:9px;color:#94A3B8">{{ d.createdAt | timeAgo }}</span>
                  </div>
                  <tui-icon icon="@tui.chevron-right"
                            class="queue-arrow"
                            style="width:16px;height:16px;color:#CBD5E1;transition:transform .18s" />
                </div>

              </a>
            }
          </div>
        }
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

  protected isAdmin() { return this.isAdminFlag(); }

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
