import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { EscrowService, TransactionSummary } from '../escrow.service';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

const FILTERS = [
  { key: 'escrow.filters.all',      status: '' },
  { key: 'escrow.filters.locked',   status: 'LOCKED' },
  { key: 'escrow.filters.shipped',  status: 'SHIPPED' },
  { key: 'escrow.filters.disputed', status: 'DISPUTED' },
];

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, TimeAgoPipe, TranslatePipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
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

      @if (loading()) {
        <app-loading-skeleton [count]="3" />
      } @else if (transactions().length === 0) {
        <app-empty-state
          icon="📋"
          [title]="'escrow.empty.title' | translate"
          [message]="'escrow.empty.message' | translate"
        />
      } @else {
        <div class="space-y-2">
          @for (tx of transactions(); track tx.id) {
            <a
              [routerLink]="['/escrow', tx.id]"
              class="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm
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

        @if (hasMore()) {
          <button
            (click)="loadMore()"
            [disabled]="loadingMore()"
            class="w-full py-3 mt-4 border border-gray-200 rounded-xl text-sm
                   text-gray-600 hover:bg-gray-50 transition-colors"
          >
            @if (loadingMore()) { {{ 'common.loading' | translate }} } @else { {{ 'escrow.loadMore' | translate }} }
          </button>
        }
      }
    </div>
  `,
})
export class TransactionListComponent implements OnInit {
  private readonly escrowService = inject(EscrowService);

  protected readonly filters = FILTERS;
  protected readonly activeFilter = signal('');
  protected readonly transactions = signal<TransactionSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(false);
  private page = 0;

  ngOnInit(): void {
    this.load();
  }

  protected setFilter(status: string): void {
    this.activeFilter.set(status);
    this.page = 0;
    this.transactions.set([]);
    this.load();
  }

  protected loadMore(): void {
    this.page++;
    this.loadingMore.set(true);
    this.fetch();
  }

  private load(): void {
    this.loading.set(true);
    this.fetch();
  }

  private fetch(): void {
    this.escrowService.getTransactions({
      status: this.activeFilter() || undefined,
      page: this.page,
      size: 20,
    }).subscribe({
      next: (data) => {
        this.transactions.update(t => this.page === 0 ? data.content : [...t, ...data.content]);
        this.hasMore.set(this.page < data.totalPages - 1);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
