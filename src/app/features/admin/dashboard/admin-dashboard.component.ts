import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { injectAdminDashboardQuery, injectAdminDisputesQuery } from '../admin.queries';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TuiIcon } from '@taiga-ui/core';
import { AdminChartsComponent } from '../charts/admin-charts.component';
import { ChartComponent } from 'ng-apexcharts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, DecimalPipe, TranslatePipe,
    StatusBadgeComponent, TimeAgoPipe, AmountPipe, TuiIcon,
    AdminChartsComponent, ChartComponent,
  ],
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; }
    .sidebar { transition: width 220ms cubic-bezier(.4,0,.2,1); }
    .nav-link { transition: background 140ms, color 140ms; }
    .nav-link.active { background: var(--color-primary-lt); color: var(--color-primary); font-weight: 600; }
    .kpi-card { transition: box-shadow 180ms, transform 180ms; }
    .kpi-card:hover { box-shadow: 0 8px 24px rgba(15,34,64,.10); transform: translateY(-1px); }
  `],
  template: `
    <!-- ══════════ SIDEBAR ══════════ -->
    <aside class="sidebar flex flex-col bg-white border-r border-slate-100 shrink-0 overflow-hidden"
           [style.width]="collapsed() ? '64px' : '240px'">

      <!-- Logo -->
      <div class="flex items-center gap-3 px-4 h-14 border-b border-slate-100 shrink-0">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
             style="background: var(--color-primary)">
          <tui-icon icon="@tui.shield-check" class="w-4 h-4 text-white" />
        </div>
        @if (!collapsed()) {
          <span class="font-black text-slate-900 text-sm tracking-tight">Katica</span>
          <span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-600">
            {{ roleBadge() }}
          </span>
        }
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3">
        @if (!collapsed()) {
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-1.5 mt-1">
            {{ 'admin.nav.sectionMain' | translate }}
          </p>
        }

        @for (item of navItems(); track item.key) {
          @if (!item.adminOnly || isAdmin()) {
            <a [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
               class="nav-link flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm text-slate-600 no-underline hover:bg-slate-50 mb-0.5"
               [title]="collapsed() ? (item.label | translate) : ''">
              <tui-icon [icon]="item.icon" class="w-4 h-4 shrink-0" />
              @if (!collapsed()) {
                <span>{{ item.label | translate }}</span>
              }
            </a>
          }
        }
      </nav>

      <!-- Account -->
      <div class="border-t border-slate-100 px-3 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
             style="background: var(--color-primary)">
          {{ roleBadge().charAt(0) }}
        </div>
        @if (!collapsed()) {
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-slate-800 m-0 truncate">{{ roleBadge() }}</p>
            <p class="text-[10px] text-slate-400 m-0">{{ 'admin.title' | translate }}</p>
          </div>
        }
      </div>
    </aside>

    <!-- ══════════ MAIN ══════════ -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">

      <!-- Top bar -->
      <div class="h-14 border-b border-slate-100 bg-white flex items-center gap-4 px-6 shrink-0">
        <!-- Sidebar toggle -->
        <button (click)="toggleSidebar()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors border-none bg-transparent cursor-pointer">
          <tui-icon [icon]="collapsed() ? '@tui.panel-left-open' : '@tui.panel-left-close'" class="w-4 h-4" />
        </button>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-sm">
          <span class="text-slate-400">Admin</span>
          <tui-icon icon="@tui.chevron-right" class="w-3.5 h-3.5 text-slate-300" />
          <span class="font-semibold text-slate-800">{{ 'admin.nav.overview' | translate }}</span>
        </div>

        <!-- Sync indicator -->
        <div class="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
          <tui-icon icon="@tui.refresh-cw" class="w-3 h-3" />
          {{ 'admin.dashboard.charts.lastSynced' | translate }}
        </div>

        <div class="ml-auto flex items-center gap-2">
          @if (isAdmin()) {
            <a routerLink="/admin/users"
               class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 no-underline hover:bg-slate-50 transition-colors">
              <tui-icon icon="@tui.users" class="w-3.5 h-3.5" />
              {{ 'admin.nav.users' | translate }}
            </a>
          }
          <a routerLink="/admin/disputes"
             class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold no-underline text-white transition-all hover:brightness-110"
             style="background: var(--color-primary)">
            <tui-icon icon="@tui.triangle-alert" class="w-3.5 h-3.5" />
            {{ 'admin.dashboard.disputes' | translate }}
          </a>
        </div>
      </div>

      <!-- ══ Scrollable content ══ -->
      <div class="flex-1 overflow-auto p-6 space-y-5" style="background: #F8FAFC">

        @if (isAdmin()) {
          @if (statsQuery.isPending()) {
            <!-- Skeleton KPI -->
            <div class="grid grid-cols-4 gap-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="bg-white rounded-xl border border-slate-100 p-5">
                  <div class="skeleton-shimmer h-3 w-2/3 rounded mb-4"></div>
                  <div class="skeleton-shimmer h-8 w-1/2 rounded mb-2"></div>
                  <div class="skeleton-shimmer h-2.5 w-1/3 rounded"></div>
                </div>
              }
            </div>

          } @else if (statsQuery.data(); as stats) {

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

              <div class="kpi-card bg-white rounded-xl border border-slate-100 p-5">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <tui-icon icon="@tui.triangle-alert" class="w-4 h-4 text-slate-400" />
                    <p class="text-sm text-slate-500 m-0 font-medium">{{ 'admin.dashboard.openDisputes' | translate }}</p>
                  </div>
                  @if (stats.openDisputes > 0) {
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                      {{ 'admin.dashboard.urgentBadge' | translate }}
                    </span>
                  }
                </div>
                <p class="text-3xl font-black text-slate-900 m-0 leading-none">{{ stats.openDisputes }}</p>
                <p class="text-xs text-slate-400 m-0 mt-2">
                  {{ 'admin.dashboard.outOfTotal' | translate:{ total: stats.totalDisputes } }}
                </p>
              </div>

              <div class="kpi-card bg-white rounded-xl border border-slate-100 p-5">
                <div class="flex items-center gap-2 mb-4">
                  <tui-icon icon="@tui.trending-up" class="w-4 h-4 text-slate-400" />
                  <p class="text-sm text-slate-500 m-0 font-medium">{{ 'admin.dashboard.volume' | translate }}</p>
                </div>
                <p class="text-2xl font-black text-slate-900 m-0 leading-none">{{ +stats.totalVolumeReleased | amount }}</p>
                <p class="text-xs text-slate-400 m-0 mt-2">{{ stats.releasedTransactions }} {{ 'admin.dashboard.releasedSuffix' | translate }}</p>
              </div>

              <div class="kpi-card bg-white rounded-xl border border-slate-100 p-5">
                <div class="flex items-center gap-2 mb-4">
                  <tui-icon icon="@tui.users" class="w-4 h-4 text-slate-400" />
                  <p class="text-sm text-slate-500 m-0 font-medium">{{ 'admin.dashboard.activeUsers' | translate }}</p>
                </div>
                <p class="text-3xl font-black text-slate-900 m-0 leading-none">{{ stats.activeUsers }}</p>
                <p class="text-xs text-slate-400 m-0 mt-2">{{ stats.totalBuyers }}A · {{ stats.totalSellers }}V · {{ stats.totalStaff }}S</p>
              </div>

              <div class="kpi-card bg-white rounded-xl border border-slate-100 p-5">
                <div class="flex items-center gap-2 mb-4">
                  <tui-icon icon="@tui.check-circle" class="w-4 h-4 text-slate-400" />
                  <p class="text-sm text-slate-500 m-0 font-medium">{{ 'admin.dashboard.resolved' | translate }}</p>
                </div>
                <p class="text-3xl font-black text-slate-900 m-0 leading-none">{{ stats.resolvedDisputes }}</p>
                <p class="text-xs text-slate-400 m-0 mt-2">
                  {{ stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0') : 0 }}% {{ 'admin.dashboard.outOfTotal' | translate:{ total: stats.totalDisputes } }}
                </p>
              </div>

            </div>

            <!-- Area Charts -->
            @if (isBrowser) {
              <div class="grid grid-cols-2 gap-4">

                <!-- Volume Trend -->
                <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div class="px-5 pt-5 pb-0 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-bold text-slate-800 m-0">{{ 'admin.dashboard.charts.volumeTrend' | translate }}</p>
                      <p class="text-xs text-slate-400 m-0 mt-0.5">{{ 'admin.dashboard.charts.vsLastMonth' | translate }}</p>
                    </div>
                    <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      @for (p of volumePeriods; track p.key) {
                        <button (click)="volumePeriod.set(p.key)"
                                class="px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-colors"
                                [class]="volumePeriod() === p.key ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500'">
                          {{ p.label | translate }}
                        </button>
                      }
                    </div>
                  </div>
                  <apx-chart
                    [series]="volumeChart().series"
                    [chart]="volumeChart().chart"
                    [xaxis]="volumeChart().xaxis"
                    [yaxis]="volumeChart().yaxis"
                    [fill]="volumeChart().fill"
                    [stroke]="volumeChart().stroke"
                    [grid]="volumeChart().grid"
                    [dataLabels]="volumeChart().dataLabels"
                    [tooltip]="volumeChart().tooltip"
                    [colors]="volumeChart().colors"
                    [markers]="volumeChart().markers"
                  />
                </div>

                <!-- Dispute Trend -->
                <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
                  <div class="px-5 pt-5 pb-0 flex items-center justify-between">
                    <div>
                      <p class="text-sm font-bold text-slate-800 m-0">{{ 'admin.dashboard.charts.disputeTrend' | translate }}</p>
                      <p class="text-xs text-slate-400 m-0 mt-0.5">{{ 'admin.dashboard.charts.vsLastMonth' | translate }}</p>
                    </div>
                    <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      @for (p of disputePeriods; track p.key) {
                        <button (click)="disputePeriod.set(p.key)"
                                class="px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-colors"
                                [class]="disputePeriod() === p.key ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500'">
                          {{ p.label | translate }}
                        </button>
                      }
                    </div>
                  </div>
                  <apx-chart
                    [series]="disputeChart().series"
                    [chart]="disputeChart().chart"
                    [xaxis]="disputeChart().xaxis"
                    [yaxis]="disputeChart().yaxis"
                    [fill]="disputeChart().fill"
                    [stroke]="disputeChart().stroke"
                    [grid]="disputeChart().grid"
                    [dataLabels]="disputeChart().dataLabels"
                    [tooltip]="disputeChart().tooltip"
                    [colors]="disputeChart().colors"
                    [markers]="disputeChart().markers"
                    [legend]="disputeChart().legend"
                  />
                </div>

              </div>
            }

            <!-- Bottom: Breakdown + Donuts -->
            <div class="grid grid-cols-3 gap-4">

              <!-- Dispute Breakdown list -->
              <div class="col-span-2 bg-white rounded-xl border border-slate-100 p-5">
                <p class="text-sm font-bold text-slate-800 m-0 mb-4">{{ 'admin.dashboard.charts.breakdownTitle' | translate }}</p>
                <div class="space-y-3">
                  @for (item of breakdownItems(stats); track item.label) {
                    <div class="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="item.bg">
                          <tui-icon [icon]="item.icon" class="w-4 h-4" [style.color]="item.color" />
                        </div>
                        <p class="text-sm font-medium text-slate-700 m-0">{{ item.label | translate }}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-lg font-black text-slate-900 m-0 leading-none">{{ item.value }}</p>
                        <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                          {{ stats.totalDisputes > 0 ? (item.value / stats.totalDisputes * 100 | number:'1.0-0') : 0 }}%
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Donut charts -->
              <div class="flex flex-col gap-4">
                <app-admin-charts [stats]="stats" [compact]="true" />
              </div>

            </div>

            <!-- Dispute Queue (condensed) -->
            <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-800 m-0">
                  {{ (isAdmin() ? 'admin.dashboard.allDisputes' : 'admin.dashboard.myQueue') | translate }}
                </p>
                <a routerLink="/admin/disputes"
                   class="flex items-center gap-1 text-xs font-semibold no-underline hover:underline"
                   style="color: var(--color-primary)">
                  {{ 'admin.dashboard.seeAll' | translate }}
                  <tui-icon icon="@tui.arrow-right" class="w-3.5 h-3.5" />
                </a>
              </div>

              @if (disputesQuery.isPending()) {
                <div class="p-4 space-y-3">
                  @for (i of [1,2,3]; track i) {
                    <div class="flex items-center gap-3">
                      <div class="skeleton-shimmer w-8 h-8 rounded-lg shrink-0"></div>
                      <div class="flex-1">
                        <div class="skeleton-shimmer h-3 w-2/5 rounded mb-1.5"></div>
                        <div class="skeleton-shimmer h-2.5 w-3/5 rounded"></div>
                      </div>
                      <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>
                    </div>
                  }
                </div>

              } @else if (disputes().length === 0) {
                <div class="p-8 text-center">
                  <tui-icon icon="@tui.check-circle" class="w-8 h-8 mx-auto mb-2" style="color: #10B981" />
                  <p class="text-sm font-bold text-slate-700 m-0">{{ 'admin.dashboard.noDisputes' | translate }}</p>
                </div>

              } @else {
                <div class="divide-y divide-slate-50">
                  @for (d of disputes(); track d.id) {
                    <a [routerLink]="['/admin/disputes', d.id]"
                       class="flex items-center gap-3 px-5 py-3 no-underline hover:bg-slate-50 transition-colors">
                      <div class="relative shrink-0">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center" [class]="disputeIconBg(d.status)">
                          <tui-icon [icon]="disputeIcon(d.status)" class="w-3.5 h-3.5" [style.color]="disputeIconColor(d.status)" />
                        </div>
                        @if (d.status === 'OPENED') {
                          <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                        <p class="text-xs text-slate-400 m-0 truncate">{{ d.buyerName ?? '—' }} · {{ d.sellerName ?? '—' }}</p>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        @if (d.grossAmount) {
                          <span class="text-xs font-semibold text-slate-600">{{ d.grossAmount | amount }}</span>
                        }
                        <app-status-badge [status]="d.status" />
                        <span class="text-[10px] text-slate-400">{{ d.createdAt | timeAgo }}</span>
                      </div>
                    </a>
                  }
                </div>
              }
            </div>

          }

        } @else {
          <!-- Support view -->
          <div class="space-y-5">
            <div class="bg-white rounded-xl border border-slate-100 p-6">
              <p class="text-slate-500 text-sm m-0 mb-1">{{ today }}</p>
              <h2 class="text-2xl font-black text-slate-900 m-0">{{ 'admin.dashboard.greeting' | translate:{ role: roleBadge() } }}</h2>
              <p class="text-slate-400 text-sm m-0 mt-1">{{ 'admin.dashboard.greetingSub' | translate }}</p>
            </div>
            <!-- Same queue for support -->
            <div class="bg-white rounded-xl border border-slate-100 overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <p class="text-sm font-bold text-slate-800 m-0">{{ 'admin.dashboard.myQueue' | translate }}</p>
                <a routerLink="/admin/disputes" class="text-xs font-semibold no-underline" style="color: var(--color-primary)">
                  {{ 'admin.dashboard.seeAll' | translate }}
                </a>
              </div>
              @if (!disputesQuery.isPending()) {
                <div class="divide-y divide-slate-50">
                  @for (d of disputes(); track d.id) {
                    <a [routerLink]="['/admin/disputes', d.id]"
                       class="flex items-center gap-3 px-5 py-3 no-underline hover:bg-slate-50">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center" [class]="disputeIconBg(d.status)">
                        <tui-icon [icon]="disputeIcon(d.status)" class="w-3.5 h-3.5" [style.color]="disputeIconColor(d.status)" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                        <p class="text-xs text-slate-400 m-0">{{ d.createdAt | timeAgo }}</p>
                      </div>
                      <app-status-badge [status]="d.status" />
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private readonly auth = inject(AuthStore);
  private readonly t = inject(TranslateService);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly isAdminFlag = computed(() => this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR');
  protected readonly statsQuery = injectAdminDashboardQuery(() => this.isAdminFlag());
  protected readonly disputesQuery = injectAdminDisputesQuery(() => ({
    isAdmin: this.isAdminFlag(), unassigned: false, page: 0, size: 10,
  }));
  protected readonly disputes = computed(() => this.disputesQuery.data()?.content ?? []);

  protected readonly collapsed = signal(false);
  protected toggleSidebar() { this.collapsed.update(v => !v); }

  protected readonly today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date());

  protected isAdmin() { return this.isAdminFlag(); }
  protected roleBadge() {
    return this.auth.isAdmin() ? 'Admin' : this.auth.role() === 'SUPERVISOR' ? 'Superviseur' : 'Support';
  }

  protected readonly navItems = computed(() => [
    { key: 'overview',      label: 'admin.nav.overview',      icon: '@tui.layout-grid',     route: ['/admin', 'dashboard'], exact: true },
    { key: 'disputes',      label: 'admin.nav.disputes',      icon: '@tui.triangle-alert',  route: ['/admin', 'disputes'] },
    { key: 'transactions',  label: 'admin.nav.transactions',  icon: '@tui.credit-card',     route: ['/admin', 'transactions'], adminOnly: true },
    { key: 'users',         label: 'admin.nav.users',         icon: '@tui.users',           route: ['/admin', 'users'], adminOnly: true },
  ]);

  // ── Period toggles ─────────────────────────────────────────────
  protected readonly volumePeriod  = signal<'monthly' | 'quarterly' | 'yearly'>('monthly');
  protected readonly disputePeriod = signal<'current' | 'previous'>('current');

  protected readonly volumePeriods = [
    { key: 'monthly'   as const, label: 'admin.dashboard.charts.monthly' },
    { key: 'quarterly' as const, label: 'admin.dashboard.charts.quarterly' },
    { key: 'yearly'    as const, label: 'admin.dashboard.charts.yearly' },
  ];
  protected readonly disputePeriods = [
    { key: 'current'  as const, label: 'admin.dashboard.charts.current' },
    { key: 'previous' as const, label: 'admin.dashboard.charts.previous' },
  ];

  // ── Mock data (replace with real API when endpoints are ready) ──
  // Needed: GET /api/admin/stats/volume?months=12 → { labels, volume, count }
  // Needed: GET /api/admin/stats/disputes?months=12 → { labels, opened, resolved }
  private readonly MOCK_LABELS    = ['Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc','Jan','Fév'];
  private readonly MOCK_VOLUME    = [180000,220000,195000,240000,210000,260000,245000,280000,265000,310000,290000,340000];
  private readonly MOCK_OPENED    = [5,8,3,12,7,9,6,11,8,15,10,13];
  private readonly MOCK_RESOLVED  = [3,6,5,9,8,7,9,8,11,12,9,14];

  private readonly AREA_BASE = {
    chart:      { type: 'area' as const, height: 240, fontFamily: 'inherit', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    grid:       { borderColor: '#F1F5F9', strokeDashArray: 3, padding: { left: 8, right: 8 } },
    stroke:     { curve: 'smooth' as const, width: 2.5 },
    markers:    { size: 3, strokeWidth: 0, hover: { size: 5 } },
    tooltip:    { theme: 'light', style: { fontSize: '12px', fontFamily: 'inherit' } },
    yaxis:      { labels: { style: { fontSize: '11px', fontFamily: 'inherit', colors: ['#94A3B8'] } } },
  };

  protected readonly volumeChart = computed(() => ({
    ...this.AREA_BASE,
    series: [{ name: this.t.instant('admin.dashboard.charts.volumeSeriesLabel'), data: this.MOCK_VOLUME }],
    colors: ['var(--color-primary)'],
    fill:   { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] } },
    xaxis:  { categories: this.MOCK_LABELS, labels: { style: { fontSize: '11px', fontFamily: 'inherit', colors: '#94A3B8' } }, axisBorder: { show: false }, axisTicks: { show: false } },
  }));

  protected readonly disputeChart = computed(() => ({
    ...this.AREA_BASE,
    series: [
      { name: this.t.instant('admin.dashboard.charts.disputeOpenedLabel'),   data: this.MOCK_OPENED },
      { name: this.t.instant('admin.dashboard.charts.disputeResolvedLabel'), data: this.MOCK_RESOLVED },
    ],
    colors: ['#DC2626', '#10B981'],
    fill:   { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.02, stops: [0, 90, 100] } },
    xaxis:  { categories: this.MOCK_LABELS, labels: { style: { fontSize: '11px', fontFamily: 'inherit', colors: '#94A3B8' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    legend: { show: true, position: 'top' as const, horizontalAlign: 'right' as const, fontSize: '11px', fontFamily: 'inherit', markers: { size: 6 } },
  }));

  // ── Breakdown list ──────────────────────────────────────────────
  protected breakdownItems(stats: any) {
    return [
      { label: 'admin.dashboard.openDisputes',    value: stats.openDisputes,                    icon: '@tui.triangle-alert',  color: '#DC2626', bg: 'bg-red-50' },
      { label: 'admin.dashboard.underReview',     value: stats.underReviewDisputes,             icon: '@tui.search',          color: '#4F46E5', bg: 'bg-indigo-50' },
      { label: 'admin.dashboard.arbitration',     value: stats.referredToArbitrationDisputes,   icon: '@tui.scale',           color: '#7C3AED', bg: 'bg-violet-50' },
      { label: 'admin.dashboard.resolved',        value: stats.resolvedDisputes,                icon: '@tui.check-circle',    color: '#10B981', bg: 'bg-emerald-50' },
    ];
  }

  // ── Dispute queue helpers ───────────────────────────────────────
  protected disputeIconBg(s: string): string {
    const m: Record<string,string> = { OPENED:'bg-red-50', UNDER_REVIEW:'bg-indigo-50', AWAITING_BUYER:'bg-amber-50', AWAITING_SELLER:'bg-amber-50', AWAITING_ARBITRATION_PAYMENT:'bg-orange-50', REFERRED_TO_ARBITRATION:'bg-violet-50', RESOLVED_BUYER:'bg-emerald-50', RESOLVED_SELLER:'bg-emerald-50', RESOLVED_SPLIT:'bg-emerald-50', CLOSED_NO_ACTION:'bg-slate-100' };
    return m[s] ?? 'bg-slate-50';
  }
  protected disputeIcon(s: string): string {
    const m: Record<string,string> = { OPENED:'@tui.triangle-alert', UNDER_REVIEW:'@tui.search', AWAITING_BUYER:'@tui.clock', AWAITING_SELLER:'@tui.clock', AWAITING_ARBITRATION_PAYMENT:'@tui.scale', REFERRED_TO_ARBITRATION:'@tui.landmark', RESOLVED_BUYER:'@tui.check-circle', RESOLVED_SELLER:'@tui.check-circle', RESOLVED_SPLIT:'@tui.handshake', CLOSED_NO_ACTION:'@tui.folder' };
    return m[s] ?? '@tui.circle';
  }
  protected disputeIconColor(s: string): string {
    const m: Record<string,string> = { OPENED:'#DC2626', UNDER_REVIEW:'#4F46E5', AWAITING_BUYER:'#D97706', AWAITING_SELLER:'#D97706', AWAITING_ARBITRATION_PAYMENT:'#EA580C', REFERRED_TO_ARBITRATION:'#7C3AED', RESOLVED_BUYER:'#10B981', RESOLVED_SELLER:'#10B981', RESOLVED_SPLIT:'#10B981', CLOSED_NO_ACTION:'#64748B' };
    return m[s] ?? '#64748B';
  }
}
