import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisputeService, DisputeSummary } from '../dispute.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, TimeAgoPipe, TranslatePipe],
  styles: [':host { display: block; height: 100%; overflow-y: auto; }'],
  template: `
    <div class="flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/dashboard"
           class="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center text-slate-600 no-underline shrink-0 transition-colors hover:bg-slate-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-slate-900 m-0">{{ 'disputes.title' | translate }}</h1>
          @if (!loading()) {
            <p class="text-xs text-slate-400 m-0">{{ 'disputes.count' | translate:{ count: disputes().length } }}</p>
          }
        </div>
        <!-- Status filter chips -->
        <div class="flex items-center gap-1.5 shrink-0">
          @for (f of filters; track f.value) {
            <button
              (click)="setFilter(f.value)"
              class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all"
              [class]="activeFilter() === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'"
            >{{ f.labelKey | translate }}</button>
          }
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 px-4 md:px-8 py-4 pb-24 md:pb-8 max-w-2xl mx-auto w-full">

        @if (loading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="bg-white rounded-2xl p-4 flex items-center gap-3">
                <div class="skeleton-shimmer w-11 h-11 rounded-[14px] shrink-0"></div>
                <div class="flex-1">
                  <div class="skeleton-shimmer h-3 w-2/5 rounded mb-2"></div>
                  <div class="skeleton-shimmer h-2.5 w-3/5 rounded mb-1.5"></div>
                  <div class="skeleton-shimmer h-2.5 w-1/4 rounded"></div>
                </div>
                <div class="skeleton-shimmer h-5 w-16 rounded-full"></div>
              </div>
            }
          </div>

        } @else if (filtered().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl mb-4">⚖️</div>
            <p class="text-base font-bold text-slate-900 m-0 mb-1">{{ 'disputes.empty.title' | translate }}</p>
            <p class="text-sm text-slate-400 m-0">{{ 'disputes.empty.message' | translate }}</p>
          </div>

        } @else {
          <div class="flex flex-col gap-2">
            @for (dispute of filtered(); track dispute.id) {
              <a
                [routerLink]="['/disputes', dispute.id]"
                class="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 no-underline shadow-[0_1px_4px_rgba(15,23,42,.06)] transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,.1)] hover:-translate-y-px border-l-[3px]"
                [class]="statusBorder(dispute.status)"
              >
                <!-- Icon -->
                <div class="w-11 h-11 rounded-[14px] shrink-0 flex items-center justify-center text-lg"
                     [class]="statusIcon(dispute.status)">
                  ⚖️
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-900 m-0 truncate">{{ dispute.transactionRef }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5 truncate">{{ 'disputes.reasons.' + dispute.reason | translate }}</p>
                  <p class="text-[11px] text-slate-400 m-0 mt-0.5">{{ dispute.createdAt | timeAgo }}</p>
                </div>

                <!-- Status + chevron -->
                <div class="flex items-center gap-2 shrink-0">
                  <app-status-badge [status]="dispute.status" />
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
  `,
})
export class DisputeListComponent implements OnInit {
  private readonly disputeService = inject(DisputeService);

  protected readonly disputes    = signal<DisputeSummary[]>([]);
  protected readonly loading     = signal(true);
  protected readonly activeFilter = signal<string>('ALL');

  protected readonly filters = [
    { value: 'ALL',         labelKey: 'disputes.filters.all' },
    { value: 'OPENED',      labelKey: 'disputes.filters.open' },
    { value: 'IN_PROGRESS', labelKey: 'disputes.filters.inProgress' },
    { value: 'RESOLVED',    labelKey: 'disputes.filters.resolved' },
  ];

  protected readonly filtered = computed(() => {
    const f = this.activeFilter();
    if (f === 'ALL') return this.disputes();
    return this.disputes().filter(d => d.status === f);
  });

  protected setFilter(value: string): void {
    this.activeFilter.set(value);
  }

  protected statusBorder(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'border-l-error', OPENED: 'border-l-error',
      IN_PROGRESS: 'border-l-amber-400',
      RESOLVED: 'border-l-success',
    };
    return map[status] ?? 'border-l-slate-200';
  }

  protected statusIcon(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'bg-red-50', OPENED: 'bg-red-50',
      IN_PROGRESS: 'bg-amber-50',
      RESOLVED: 'bg-success-lt',
    };
    return map[status] ?? 'bg-slate-50';
  }

  ngOnInit(): void {
    this.disputeService.getDisputes({ page: 0, size: 50 }).subscribe({
      next: (data) => { this.disputes.set(data.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
