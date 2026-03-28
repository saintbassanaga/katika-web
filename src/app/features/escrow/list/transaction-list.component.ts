import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { injectEscrowListInfiniteQuery } from '../escrow.queries';

const FILTERS = [
  { key: 'escrow.filters.all',       status: '' },
  { key: 'escrow.filters.pending',   status: 'PENDING_ACCEPTANCE' },
  { key: 'escrow.filters.locked',    status: 'LOCKED' },
  { key: 'escrow.filters.shipped',   status: 'SHIPPED' },
  { key: 'escrow.filters.disputed',  status: 'DISPUTED' },
];

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, TimeAgoPipe, TranslatePipe],
  template: `
    <div class="animate-fade px-4 py-6 pb-24 max-w-lg mx-auto">
      <h1 class="text-xl font-bold text-gray-900 mb-4">{{ 'escrow.title' | translate }}</h1>

      <!-- Filter chips -->
      <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        @for (filter of filters; track filter.key) {
          <button
            (click)="setFilter(filter.status)"
            class="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
            [style.background]="activeFilter() === filter.status ? 'var(--clr-primary)' : 'var(--clr-surface)'"
            [style.color]="activeFilter() === filter.status ? '#fff' : 'var(--clr-muted)'"
            [style.border-color]="activeFilter() === filter.status ? 'var(--clr-primary)' : 'var(--clr-border)'"
          >
            {{ filter.key | translate }}
          </button>
        }
      </div>

      @if (query.isPending()) {
        <app-loading-skeleton [count]="3" />
      } @else if (query.isError()) {
        <app-empty-state icon="@tui.triangle-alert"
          [title]="'common.errorTitle' | translate"
          [message]="'common.errorMessage' | translate" />
      } @else if (transactions().length === 0) {
        <app-empty-state icon="@tui.clipboard-list"
          [title]="'escrow.empty.title' | translate"
          [message]="'escrow.empty.message' | translate" />
      } @else {
        <div class="space-y-2">
          @for (tx of transactions(); track tx.id) {
            <a
              [routerLink]="['/escrow', tx.id]"
              class="animate-entry stagger-item flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
                     hover:shadow-md transition-shadow active:scale-[0.99]"
            >
              <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                   style="background: var(--clr-primary-lt); color: var(--clr-primary)">
                {{ tx.buyerName[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">{{ tx.reference }}</p>
                <p class="text-xs text-gray-500 truncate">{{ tx.buyerName }}</p>
                <p class="text-xs text-gray-400">{{ tx.createdAt | timeAgo }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold text-gray-900">{{ tx.grossAmount | amount }}</p>
                <app-status-badge [status]="tx.status" />
              </div>
            </a>
          }
        </div>

        @if (query.hasNextPage()) {
          <button
            (click)="query.fetchNextPage()"
            [disabled]="query.isFetchingNextPage()"
            class="w-full py-3 mt-4 border border-gray-200 rounded-xl text-sm
                   text-gray-600 hover:bg-gray-50 transition-colors"
          >
            @if (query.isFetchingNextPage()) {
              {{ 'common.loading' | translate }}
            } @else {
              {{ 'escrow.loadMore' | translate }}
            }
          </button>
        }
      }
    </div>
  `,
})
export class TransactionListComponent {
  protected readonly filters      = FILTERS;
  protected readonly activeFilter = signal('');

  protected readonly query = injectEscrowListInfiniteQuery(this.activeFilter);

  /** Flatten all pages into a single array */
  protected readonly transactions = computed(() =>
    this.query.data()?.pages.flatMap(p => p.content) ?? [],
  );

  protected setFilter(status: string): void {
    this.activeFilter.set(status);
  }
}
