import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartComponent } from 'ng-apexcharts';
import type { AdminDashboardStats } from '../admin.service';

@Component({
  selector: 'app-admin-charts',
  standalone: true,
  imports: [ChartComponent, TranslatePipe],
  template: `
    @if (isBrowser) {
      <section class="h-full flex flex-col">
        @if (!compact()) {
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 m-0">
            {{ 'admin.dashboard.charts.title' | translate }}
          </p>
        }

        <div [class]="compact() ? 'flex flex-col gap-4 flex-1' : 'grid grid-cols-1 md:grid-cols-3 gap-4'">

          <!-- Dispute Status Donut -->
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="px-4 pt-4 pb-0">
              <p class="text-xs font-bold text-slate-700 m-0">{{ 'admin.dashboard.charts.disputesByStatus' | translate }}</p>
              <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                {{ 'admin.dashboard.charts.disputesTotal' | translate:{ total: stats().totalDisputes } }}
              </p>
            </div>
            <apx-chart
              [series]="disputeChart().series"
              [chart]="disputeChart().chart"
              [labels]="disputeChart().labels"
              [colors]="disputeChart().colors"
              [plotOptions]="disputeChart().plotOptions"
              [dataLabels]="disputeChart().dataLabels"
              [legend]="disputeChart().legend"
              [stroke]="disputeChart().stroke"
              [tooltip]="disputeChart().tooltip"
            />
          </div>

          <!-- Release Rate Radial Bar -->
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div class="px-4 pt-4 pb-0">
              <p class="text-xs font-bold text-slate-700 m-0">{{ 'admin.dashboard.charts.releaseRate' | translate }}</p>
              <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                {{ 'admin.dashboard.charts.releasedTx' | translate:{ released: stats().releasedTransactions, volume: stats().totalVolumeReleased } }}
              </p>
            </div>
            <apx-chart
              [series]="radialChart().series"
              [chart]="radialChart().chart"
              [labels]="radialChart().labels"
              [colors]="radialChart().colors"
              [fill]="radialChart().fill"
              [plotOptions]="radialChart().plotOptions"
              [stroke]="radialChart().stroke"
              [grid]="radialChart().grid"
            />
          </div>

          <!-- Transaction Pipeline Donut (hidden in compact mode) -->
          @if (!compact()) {
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div class="px-4 pt-4 pb-0">
                <p class="text-xs font-bold text-slate-700 m-0">{{ 'admin.dashboard.charts.txPipeline' | translate }}</p>
                <p class="text-[10px] text-slate-400 m-0 mt-0.5">
                  {{ 'admin.dashboard.charts.disputesTotal' | translate:{ total: stats().totalTransactions } }}
                </p>
              </div>
              <apx-chart
                [series]="txChart().series"
                [chart]="txChart().chart"
                [labels]="txChart().labels"
                [colors]="txChart().colors"
                [plotOptions]="txChart().plotOptions"
                [dataLabels]="txChart().dataLabels"
                [legend]="txChart().legend"
                [stroke]="txChart().stroke"
                [tooltip]="txChart().tooltip"
              />
            </div>
          }

        </div>
      </section>
    }
  `,
})
export class AdminChartsComponent {
  readonly stats = input.required<AdminDashboardStats>();
  readonly compact = input(false);

  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly t = inject(TranslateService);

  private i(key: string) { return this.t.instant(`admin.dashboard.charts.${key}`); }

  private get chartHeight() { return this.compact() ? 200 : 260; }

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
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px', fontFamily: 'inherit' },
    },
  };

  protected readonly disputeChart = computed(() => {
    const s = this.stats();
    return {
      ...this.DONUT_BASE,
      chart: { ...this.DONUT_BASE.chart, height: this.chartHeight },
      series: [s.openDisputes, s.underReviewDisputes, s.referredToArbitrationDisputes, s.resolvedDisputes],
      labels: [this.i('open'), this.i('underReview'), this.i('arbitration'), this.i('resolved')],
      colors: ['#DC2626', '#4F46E5', '#7C3AED', '#10B981'],
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { show: true, fontSize: '11px', color: '#94A3B8', offsetY: -4 },
              value: { show: true, fontSize: '22px', fontWeight: '700', color: '#0F172A', offsetY: 4 },
              total: {
                show: true,
                label: this.i('total'),
                fontSize: '11px',
                color: '#94A3B8',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
              },
            },
          },
        },
      },
    };
  });

  protected readonly txChart = computed(() => {
    const s = this.stats();
    return {
      ...this.DONUT_BASE,
      series: [s.initiatedTransactions, s.lockedTransactions, s.releasedTransactions, s.disputedTransactions, s.cancelledTransactions],
      labels: [this.i('initiated'), this.i('locked'), this.i('released'), this.i('disputed'), this.i('cancelled')],
      colors: ['#3B82F6', '#F59E0B', '#10B981', '#DC2626', '#94A3B8'],
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { show: true, fontSize: '11px', color: '#94A3B8', offsetY: -4 },
              value: { show: true, fontSize: '22px', fontWeight: '700', color: '#0F172A', offsetY: 4 },
              total: {
                show: true,
                label: this.i('total'),
                fontSize: '11px',
                color: '#94A3B8',
                formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
              },
            },
          },
        },
      },
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
        height: this.chartHeight,
        fontFamily: 'inherit',
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout' as const, speed: 900 },
      },
      labels: [this.i('releaseRateLabel')],
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
