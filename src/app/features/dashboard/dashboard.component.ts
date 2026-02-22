import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { environment } from '../../../environments/environment';

interface WalletBalance {
  balance: number;
  frozenAmount: number;
  currency: string;
}

interface TransactionSummary {
  id: string;
  reference: string;
  counterpartName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface DisputeSummary {
  id: string;
  transactionRef: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <p class="text-sm text-gray-500">Bonjour,</p>
          <h1 class="text-xl font-bold text-gray-900">{{ auth.fullName() }}</h1>
        </div>
        <a routerLink="/profile" class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {{ auth.initials() }}
        </a>
      </div>

      @if (loading()) {
        <app-loading-skeleton [count]="3" />
      } @else {
        <!-- Wallet card -->
        @if (wallet()) {
          <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-4">
            <p class="text-blue-100 text-sm mb-1">Solde disponible</p>
            <div class="flex items-center gap-2 mb-1">
              @if (balanceVisible()) {
                <span class="text-3xl font-bold">{{ wallet()!.balance | amount }}</span>
              } @else {
                <span class="text-3xl font-bold">••••••</span>
              }
              <button (click)="balanceVisible.set(!balanceVisible())" class="text-blue-200 hover:text-white">
                {{ balanceVisible() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (wallet()!.frozenAmount > 0) {
              <p class="text-blue-200 text-xs">Bloqué: {{ wallet()!.frozenAmount | amount }}</p>
            }
            <div class="flex gap-2 mt-4">
              <a routerLink="/payouts/new"
                 class="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-center transition-colors">
                ↑ Retirer
              </a>
              <a routerLink="/wallet"
                 class="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium text-center transition-colors">
                Portefeuille
              </a>
            </div>
          </div>
        }

        <!-- Open disputes alert -->
        @if (disputes().length > 0) {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-red-500">⚠</span>
              <p class="text-sm font-semibold text-red-700">{{ disputes().length }} litige(s) en cours</p>
            </div>
            <a routerLink="/disputes" class="text-xs text-red-600 hover:underline">Voir les litiges →</a>
          </div>
        }

        <!-- Recent transactions -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-gray-900">Transactions récentes</h2>
            <a routerLink="/escrow" class="text-sm text-blue-600 hover:underline">Voir tout</a>
          </div>

          @if (transactions().length === 0) {
            <app-empty-state
              icon="📋"
              title="Aucune transaction"
              message="Vos transactions apparaîtront ici"
            />
          } @else {
            <div class="space-y-2">
              @for (tx of transactions(); track tx.id) {
                <a
                  [routerLink]="['/escrow', tx.id]"
                  class="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {{ tx.counterpartName[0] }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ tx.reference }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ tx.counterpartName }}</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold text-gray-900">{{ tx.amount | amount }}</p>
                    <app-status-badge [status]="tx.status" />
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly wallet = signal<WalletBalance | null>(null);
  protected readonly transactions = signal<TransactionSummary[]>([]);
  protected readonly disputes = signal<DisputeSummary[]>([]);
  protected readonly balanceVisible = signal(false);

  ngOnInit(): void {
    forkJoin({
      wallet: this.http.get<WalletBalance>(`${environment.apiUrl}/wallet`, { withCredentials: true }),
      transactions: this.http.get<{ content: TransactionSummary[] }>(`${environment.apiUrl}/escrow?status=LOCKED,SHIPPED&limit=5&page=0&size=5`, { withCredentials: true }),
      disputes: this.http.get<{ content: DisputeSummary[] }>(`${environment.apiUrl}/disputes?status=OPEN&limit=3&page=0&size=3`, { withCredentials: true }),
    }).subscribe({
      next: (data) => {
        this.wallet.set(data.wallet);
        this.transactions.set(data.transactions?.content ?? []);
        this.disputes.set(data.disputes?.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
