import { Component, computed, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartComponent } from 'ng-apexcharts';
import type { AdminDashboardStats } from '../admin.service';
import {
  injectVolumeTrendQuery,
  injectDisputeTrendQuery,
  injectTransactionTrendQuery,
  injectRevenueTrendQuery,
  injectNewUsersTrendQuery,
  injectDisputeRateTrendQuery,
  injectPayoutTrendQuery,
} from '../admin.queries';

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  imports: [ChartComponent],
  styles: [`
    .chart-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 1px 4px rgba(15,34,64,.08);
      overflow: hidden;
    }
    .chart-card-header {
      padding: 16px 20px 4px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .chart-card-title {
      font-size: 12px;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
      line-height: 1.4;
    }
    .chart-card-sub {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
    .skeleton-block {
      margin: 12px 16px 16px;
      border-radius: 10px;
    }
    .month-toggle {
      display: flex;
      gap: 2px;
      background: #F1F5F9;
      border-radius: 10px;
      padding: 3px;
    }
    .month-btn {
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.18s ease;
      color: #94A3B8;
      background: transparent;
    }
    .month-btn.active {
      background: #fff;
      color: #0F172A;
      box-shadow: 0 1px 3px rgba(0,0,0,.10);
    }
    .section-eyebrow {
      font-size: 10px;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: .1em;
      text-transform: uppercase;
      margin: 0 0 12px;
    }
    .hero-stat {
      text-align: right;
      flex-shrink: 0;
    }
    .hero-stat-val {
      font-size: 15px;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      line-height: 1.2;
    }
    .hero-stat-sub {
      font-size: 10px;
      color: #94A3B8;
      margin: 2px 0 0;
    }
  `],
  template: `
    @if (isBrowser) {

      <!-- ══ Header ══ -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div>
          <p class="section-eyebrow" style="margin-bottom:2px">Platform Intelligence</p>
          <h2 style="font-size:14px;font-weight:900;color:#0F172A;margin:0;letter-spacing:-.02em">Analytics</h2>
        </div>
        <div class="month-toggle">
          @for (m of [6, 12, 24]; track m) {
            <button class="month-btn" [class.active]="months() === m" (click)="months.set(m)">
              {{ m }}M
            </button>
          }
        </div>
      </div>

      <!-- ══ ROW 1 — Volume Hero ══ -->
      <div class="chart-card" style="margin-bottom:16px">
        <div class="chart-card-header">
          <div>
            <p class="chart-card-title">Released Volume</p>
            <p class="chart-card-sub">XAF released to sellers · last {{ months() }} months</p>
          </div>
          @if (volumeQ.data(); as d) {
            <div class="hero-stat">
              <p class="hero-stat-val">{{ totalVol() }}</p>
              <p class="hero-stat-sub">{{ totalTxCount() }} transactions</p>
            </div>
          }
        </div>
        @if (volumeChart(); as c) {
          <apx-chart
            [series]="c.series" [chart]="c.chart" [colors]="c.colors"
            [fill]="c.fill" [stroke]="c.stroke" [xaxis]="c.xaxis"
            [yaxis]="c.yaxis" [dataLabels]="c.dataLabels"
            [grid]="c.grid" [tooltip]="c.tooltip" />
        } @else {
          <div class="skeleton-shimmer skeleton-block" style="height:256px"></div>
        }
      </div>

      <!-- ══ ROW 2 — Dispute + Transaction ══ -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px" class="max-md:grid-cols-1">

        <!-- Dispute Trend -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Dispute Trend</p>
              <p class="chart-card-sub">Opened vs resolved per month</p>
            </div>
            @if (disputeQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#EF4444">{{ totalDisputesOpened() }}</p>
                <p class="hero-stat-sub">opened total</p>
              </div>
            }
          </div>
          @if (disputeChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [stroke]="c.stroke" [xaxis]="c.xaxis" [yaxis]="c.yaxis"
              [dataLabels]="c.dataLabels" [grid]="c.grid" [tooltip]="c.tooltip"
              [legend]="c.legend" [markers]="c.markers" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>

        <!-- Transaction Pipeline -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Transaction Pipeline</p>
              <p class="chart-card-sub">Created · Released · Disputed</p>
            </div>
            @if (txQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#6366F1">{{ totalTxCreated() }}</p>
                <p class="hero-stat-sub">created total</p>
              </div>
            }
          </div>
          @if (txChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [plotOptions]="c.plotOptions" [xaxis]="c.xaxis" [yaxis]="c.yaxis"
              [dataLabels]="c.dataLabels" [grid]="c.grid" [tooltip]="c.tooltip"
              [legend]="c.legend" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>
      </div>

      <!-- ══ ROW 3 — Revenue + Users ══ -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px" class="max-md:grid-cols-1">

        <!-- Platform Revenue -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Platform Revenue</p>
              <p class="chart-card-sub">Fees collected per month</p>
            </div>
            @if (revenueQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#7C3AED">{{ totalFees() }}</p>
                <p class="hero-stat-sub">fees collected</p>
              </div>
            }
          </div>
          @if (revenueChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [fill]="c.fill" [stroke]="c.stroke" [xaxis]="c.xaxis"
              [yaxis]="c.yaxis" [dataLabels]="c.dataLabels"
              [grid]="c.grid" [tooltip]="c.tooltip" [legend]="c.legend" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>

        <!-- New Registrations -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">New Registrations</p>
              <p class="chart-card-sub">Buyers & sellers per month</p>
            </div>
            @if (newUsersQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#3B82F6">{{ totalNewUsers() }}</p>
                <p class="hero-stat-sub">total registered</p>
              </div>
            }
          </div>
          @if (newUsersChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [plotOptions]="c.plotOptions" [xaxis]="c.xaxis" [yaxis]="c.yaxis"
              [dataLabels]="c.dataLabels" [grid]="c.grid" [tooltip]="c.tooltip"
              [legend]="c.legend" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>
      </div>

      <!-- ══ ROW 4 — Dispute Rate + Payouts ══ -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px" class="max-md:grid-cols-1">

        <!-- Dispute Rate -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Dispute Rate</p>
              <p class="chart-card-sub">% of transactions that turned into disputes</p>
            </div>
            @if (disputeRateQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#F59E0B">
                  {{ avgDisputeRate() }}%
                </p>
                <p class="hero-stat-sub">avg rate</p>
              </div>
            }
          </div>
          @if (disputeRateChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [fill]="c.fill" [stroke]="c.stroke" [xaxis]="c.xaxis"
              [yaxis]="c.yaxis" [dataLabels]="c.dataLabels"
              [grid]="c.grid" [tooltip]="c.tooltip" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>

        <!-- Payouts by Operator -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Payouts by Operator</p>
              <p class="chart-card-sub">MTN vs Orange volume per month</p>
            </div>
            @if (payoutQ.data(); as d) {
              <div class="hero-stat">
                <p class="hero-stat-val" style="color:#EAB308">{{ totalPayouts() }}</p>
                <p class="hero-stat-sub">total disbursed</p>
              </div>
            }
          </div>
          @if (payoutChart(); as c) {
            <apx-chart
              [series]="c.series" [chart]="c.chart" [colors]="c.colors"
              [plotOptions]="c.plotOptions" [xaxis]="c.xaxis" [yaxis]="c.yaxis"
              [dataLabels]="c.dataLabels" [grid]="c.grid" [tooltip]="c.tooltip"
              [legend]="c.legend" />
          } @else {
            <div class="skeleton-shimmer skeleton-block" style="height:208px"></div>
          }
        </div>
      </div>

      <!-- ══ ROW 5 — Snapshot Donuts ══ -->
      <p class="section-eyebrow">Current Snapshot</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px" class="max-md:grid-cols-1">

        <!-- Dispute Status Donut -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Disputes by Status</p>
              <p class="chart-card-sub">{{ stats().totalDisputes }} total</p>
            </div>
          </div>
          <apx-chart
            [series]="disputeDonut().series" [chart]="disputeDonut().chart"
            [labels]="disputeDonut().labels" [colors]="disputeDonut().colors"
            [plotOptions]="disputeDonut().plotOptions" [dataLabels]="disputeDonut().dataLabels"
            [legend]="disputeDonut().legend" [stroke]="disputeDonut().stroke"
            [tooltip]="disputeDonut().tooltip" />
        </div>

        <!-- Transaction Pipeline Donut -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Transaction Pipeline</p>
              <p class="chart-card-sub">{{ stats().totalTransactions }} total</p>
            </div>
          </div>
          <apx-chart
            [series]="txDonut().series" [chart]="txDonut().chart"
            [labels]="txDonut().labels" [colors]="txDonut().colors"
            [plotOptions]="txDonut().plotOptions" [dataLabels]="txDonut().dataLabels"
            [legend]="txDonut().legend" [stroke]="txDonut().stroke"
            [tooltip]="txDonut().tooltip" />
        </div>

        <!-- Release Rate Radial -->
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <p class="chart-card-title">Release Rate</p>
              <p class="chart-card-sub">{{ stats().releasedTransactions }} tx released</p>
            </div>
          </div>
          <apx-chart
            [series]="radialChart().series" [chart]="radialChart().chart"
            [labels]="radialChart().labels" [colors]="radialChart().colors"
            [fill]="radialChart().fill" [plotOptions]="radialChart().plotOptions"
            [stroke]="radialChart().stroke" [grid]="radialChart().grid" />
        </div>

      </div>

    }
  `,
})
export class AdminChartsComponent {
  readonly stats = input.required<AdminDashboardStats>();
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly months = signal(12);

  // ── Queries ───────────────────────────────────────────────────────────────

  protected readonly volumeQ      = injectVolumeTrendQuery(() => this.months());
  protected readonly disputeQ     = injectDisputeTrendQuery(() => this.months());
  protected readonly txQ          = injectTransactionTrendQuery(() => this.months());
  protected readonly revenueQ     = injectRevenueTrendQuery(() => this.months());
  protected readonly newUsersQ    = injectNewUsersTrendQuery(() => this.months());
  protected readonly disputeRateQ = injectDisputeRateTrendQuery(() => this.months());
  protected readonly payoutQ      = injectPayoutTrendQuery(() => this.months());

  // ── Summary helpers ───────────────────────────────────────────────────────

  protected readonly totalVol = computed(() => {
    const d = this.volumeQ.data();
    if (!d) return '—';
    const t = d.volume.reduce((a, b) => a + Number(b), 0);
    return t >= 1_000_000 ? `${(t / 1_000_000).toFixed(1)}M XAF` : `${(t / 1_000).toFixed(0)}k XAF`;
  });

  protected readonly totalTxCount = computed(() => {
    const d = this.volumeQ.data();
    if (!d) return 0;
    return d.count.reduce((a, b) => a + Number(b), 0);
  });

  protected readonly totalDisputesOpened = computed(() => {
    const d = this.disputeQ.data();
    if (!d) return 0;
    return d.opened.reduce((a, b) => a + b, 0);
  });

  protected readonly totalTxCreated = computed(() => {
    const d = this.txQ.data();
    if (!d) return 0;
    return d.totalCreated.reduce((a, b) => a + b, 0);
  });

  protected readonly totalNewUsers = computed(() => {
    const d = this.newUsersQ.data();
    if (!d) return 0;
    return d.totalRegistered.reduce((a, b) => a + b, 0);
  });

  protected readonly totalFees = computed(() => {
    const d = this.revenueQ.data();
    if (!d) return '—';
    const t = d.feesCollected.reduce((a, b) => a + Number(b), 0);
    return t >= 1_000_000 ? `${(t / 1_000_000).toFixed(1)}M XAF` : `${(t / 1_000).toFixed(0)}k XAF`;
  });

  protected readonly avgDisputeRate = computed(() => {
    const d = this.disputeRateQ.data();
    if (!d || !d.disputeRatePct.length) return '0.00';
    const avg = d.disputeRatePct.reduce((a, b) => a + b, 0) / d.disputeRatePct.length;
    return avg.toFixed(2);
  });

  protected readonly totalPayouts = computed(() => {
    const d = this.payoutQ.data();
    if (!d) return '—';
    const t = d.totalAmount.reduce((a, b) => a + Number(b), 0);
    return t >= 1_000_000 ? `${(t / 1_000_000).toFixed(1)}M XAF` : `${(t / 1_000).toFixed(0)}k XAF`;
  });

  // ── Chart config helpers ──────────────────────────────────────────────────

  private base(type: 'area' | 'line' | 'bar' | 'donut' | 'radialBar', height: number) {
    return {
      type,
      height,
      fontFamily: 'inherit',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout' as const, speed: 700 },
    };
  }

  private readonly GRID = {
    strokeDashArray: 4,
    borderColor: '#F1F5F9',
    xaxis: { lines: { show: false } },
    padding: { left: 0, right: 4 },
  };

  private xaxis(labels: string[]) {
    return {
      categories: labels,
      labels: { style: { fontSize: '10px', colors: '#94A3B8', fontFamily: 'inherit' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    };
  }

  private yaxis(formatter: (v: number) => string) {
    return {
      labels: {
        style: { fontSize: '10px', colors: '#94A3B8', fontFamily: 'inherit' },
        formatter,
      },
    };
  }

  private readonly GRAD_FILL = {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.02, stops: [0, 95, 100] },
  };

  private readonly DONUT_BASE = {
    chart: {
      type: 'donut' as const,
      height: 260,
      fontFamily: 'inherit',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout' as const, speed: 800 },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: {
      show: true,
      position: 'bottom' as const,
      fontSize: '11px',
      fontFamily: 'inherit',
      markers: { size: 7 },
      itemMargin: { horizontal: 6, vertical: 3 },
    },
    tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: 'inherit' } },
  };

  private donutPlotOptions(total: () => number) {
    return {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { show: true, fontSize: '11px', color: '#94A3B8', offsetY: -4 },
            value: { show: true, fontSize: '22px', fontWeight: '700', color: '#0F172A', offsetY: 4 },
            total: {
              show: true,
              label: 'Total',
              fontSize: '11px',
              color: '#94A3B8',
              formatter: () => String(total()),
            },
          },
        },
      },
    };
  }

  // ── Trend chart configs ───────────────────────────────────────────────────

  protected readonly volumeChart = computed(() => {
    const d = this.volumeQ.data();
    if (!d) return null;
    return {
      series: [{ name: 'Volume XAF', data: d.volume.map(Number) }],
      chart: this.base('area', 260),
      colors: ['#10B981'],
      fill: this.GRAD_FILL,
      stroke: { curve: 'smooth' as const, width: 2.5 },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) =>
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v)
      ),
      dataLabels: { enabled: false },
      grid: this.GRID,
      tooltip: { theme: 'light', y: { formatter: (v: number) => `${v.toLocaleString()} XAF` } },
    };
  });

  protected readonly disputeChart = computed(() => {
    const d = this.disputeQ.data();
    if (!d) return null;
    return {
      series: [
        { name: 'Opened', data: d.opened },
        { name: 'Resolved', data: d.resolved },
      ],
      chart: this.base('line', 220),
      colors: ['#EF4444', '#10B981'],
      stroke: { curve: 'smooth' as const, width: 2.5 },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) => String(Math.round(v))),
      dataLabels: { enabled: false },
      grid: this.GRID,
      legend: {
        show: true, position: 'top' as const,
        fontSize: '11px', fontFamily: 'inherit',
        markers: { size: 6 },
      },
      markers: { size: 4, hover: { size: 6 } },
      tooltip: { theme: 'light', shared: true, intersect: false },
    };
  });

  protected readonly txChart = computed(() => {
    const d = this.txQ.data();
    if (!d) return null;
    return {
      series: [
        { name: 'Created',  data: d.totalCreated },
        { name: 'Released', data: d.released },
        { name: 'Disputed', data: d.disputed },
      ],
      chart: { ...this.base('bar', 220), stacked: false } as const,
      colors: ['#6366F1', '#10B981', '#EF4444'],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '62%' } },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) => String(Math.round(v))),
      dataLabels: { enabled: false },
      grid: this.GRID,
      legend: {
        show: true, position: 'top' as const,
        fontSize: '11px', fontFamily: 'inherit',
        markers: { size: 6 },
      },
      tooltip: { theme: 'light', shared: true, intersect: false },
    };
  });

  protected readonly revenueChart = computed(() => {
    const d = this.revenueQ.data();
    if (!d) return null;
    return {
      series: [
        { name: 'Fees XAF',     data: d.feesCollected.map(Number) },
        { name: 'Gross Volume', data: d.grossVolume.map(Number) },
      ],
      chart: this.base('area', 220),
      colors: ['#7C3AED', '#A78BFA'],
      fill: this.GRAD_FILL,
      stroke: { curve: 'smooth' as const, width: [2.5, 1.5] },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) =>
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`
      ),
      dataLabels: { enabled: false },
      grid: this.GRID,
      legend: {
        show: true, position: 'top' as const,
        fontSize: '11px', fontFamily: 'inherit',
        markers: { size: 6 },
      },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => `${v.toLocaleString()} XAF` },
      },
    };
  });

  protected readonly newUsersChart = computed(() => {
    const d = this.newUsersQ.data();
    if (!d) return null;
    return {
      series: [
        { name: 'Buyers',  data: d.buyers },
        { name: 'Sellers', data: d.sellers },
      ],
      chart: { ...this.base('bar', 220), stacked: true } as const,
      colors: ['#3B82F6', '#F59E0B'],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) => String(Math.round(v))),
      dataLabels: { enabled: false },
      grid: this.GRID,
      legend: {
        show: true, position: 'top' as const,
        fontSize: '11px', fontFamily: 'inherit',
        markers: { size: 6 },
      },
      tooltip: { theme: 'light', shared: true, intersect: false },
    };
  });

  protected readonly disputeRateChart = computed(() => {
    const d = this.disputeRateQ.data();
    if (!d) return null;
    return {
      series: [{ name: 'Dispute Rate %', data: d.disputeRatePct.map(v => +v.toFixed(2)) }],
      chart: this.base('area', 220),
      colors: ['#F59E0B'],
      fill: this.GRAD_FILL,
      stroke: { curve: 'smooth' as const, width: 2.5 },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) => `${v.toFixed(1)}%`),
      dataLabels: { enabled: false },
      grid: this.GRID,
      tooltip: { theme: 'light', y: { formatter: (v: number) => `${v.toFixed(2)}%` } },
    };
  });

  protected readonly payoutChart = computed(() => {
    const d = this.payoutQ.data();
    if (!d) return null;
    return {
      series: [
        { name: 'MTN',    data: d.mtnAmount.map(Number) },
        { name: 'Orange', data: d.orangeAmount.map(Number) },
      ],
      chart: { ...this.base('bar', 220), stacked: false } as const,
      colors: ['#EAB308', '#F97316'],
      plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
      xaxis: this.xaxis(d.labels),
      yaxis: this.yaxis((v: number) =>
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}k`
      ),
      dataLabels: { enabled: false },
      grid: this.GRID,
      legend: {
        show: true, position: 'top' as const,
        fontSize: '11px', fontFamily: 'inherit',
        markers: { size: 6 },
      },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => `${v.toLocaleString()} XAF` },
      },
    };
  });

  // ── Snapshot donuts ───────────────────────────────────────────────────────

  protected readonly disputeDonut = computed(() => {
    const s = this.stats();
    return {
      ...this.DONUT_BASE,
      series: [s.openDisputes, s.underReviewDisputes, s.referredToArbitrationDisputes, s.resolvedDisputes],
      labels: ['Open', 'In Review', 'Arbitration', 'Resolved'],
      colors: ['#DC2626', '#4F46E5', '#7C3AED', '#10B981'],
      plotOptions: this.donutPlotOptions(() => s.totalDisputes),
    };
  });

  protected readonly txDonut = computed(() => {
    const s = this.stats();
    return {
      ...this.DONUT_BASE,
      series: [s.initiatedTransactions, s.lockedTransactions, s.releasedTransactions, s.disputedTransactions, s.cancelledTransactions],
      labels: ['Initiated', 'Locked', 'Released', 'Disputed', 'Cancelled'],
      colors: ['#3B82F6', '#F59E0B', '#10B981', '#DC2626', '#94A3B8'],
      plotOptions: this.donutPlotOptions(() => s.totalTransactions),
    };
  });

  protected readonly radialChart = computed(() => {
    const s = this.stats();
    const rate = s.totalTransactions > 0
      ? Math.round((s.releasedTransactions / s.totalTransactions) * 100)
      : 0;
    return {
      series: [rate],
      chart: {
        type: 'radialBar' as const,
        height: 260,
        fontFamily: 'inherit',
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout' as const, speed: 900 },
      },
      labels: ['Released'],
      colors: ['#10B981'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark' as const,
          type: 'horizontal' as const,
          gradientToColors: ['#3B82F6'],
          stops: [0, 100],
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            margin: 0,
            size: '70%',
            background: '#fff',
            dropShadow: { enabled: true, top: 3, left: 0, blur: 4, opacity: 0.06 },
          },
          track: { background: '#F1F5F9', strokeWidth: '97%' },
          dataLabels: {
            name: { show: true, fontSize: '11px', color: '#94A3B8', offsetY: 20 },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: '700',
              color: '#0F172A',
              offsetY: -10,
              formatter: (val: number) => `${Math.round(val)}%`,
            },
          },
        },
      },
      stroke: { lineCap: 'round' as const },
      grid: { padding: { top: -10, bottom: -10 } },
    };
  });
}
