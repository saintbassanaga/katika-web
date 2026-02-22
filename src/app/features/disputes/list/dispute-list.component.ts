import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisputeService, DisputeSummary } from '../dispute.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, TimeAgoPipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <h1 class="text-xl font-bold text-gray-900 mb-4">Litiges</h1>

      @if (loading()) {
        <app-loading-skeleton [count]="3" />
      } @else if (disputes().length === 0) {
        <app-empty-state icon="⚖" title="Aucun litige" message="Vous n'avez aucun litige en cours" />
      } @else {
        <div class="space-y-2">
          @for (dispute of disputes(); track dispute.id) {
            <a
              [routerLink]="['/disputes', dispute.id]"
              class="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-xl shrink-0">⚖</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">{{ dispute.transactionRef }}</p>
                <p class="text-xs text-gray-500">{{ reasonLabel(dispute.reason) }}</p>
                <p class="text-xs text-gray-400">{{ dispute.createdAt | timeAgo }}</p>
              </div>
              <app-status-badge [status]="dispute.status" />
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class DisputeListComponent implements OnInit {
  private readonly disputeService = inject(DisputeService);

  protected readonly disputes = signal<DisputeSummary[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.disputeService.getDisputes({ page: 0, size: 20 }).subscribe({
      next: (data) => { this.disputes.set(data.content); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected reasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      ITEM_NOT_RECEIVED: 'Article non reçu',
      ITEM_NOT_AS_DESCRIBED: 'Article non conforme',
      SELLER_NOT_RESPONDING: 'Vendeur non réactif',
      OTHER: 'Autre',
    };
    return labels[reason] ?? reason;
  }
}
