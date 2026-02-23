import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';

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
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, TranslatePipe],
  styles: [`
    .page { min-height: 100svh; background: #EDF1F7; }

    /* ── Dark header ── */
    .header {
      background: #0F2240;
      padding: 1.25rem 1.25rem 4.5rem;
      position: relative; overflow: hidden;
    }
    .header-orb {
      position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(201,146,13,.22) 0%, transparent 70%);
      width: 320px; height: 320px; top: -50%; right: -12%;
    }
    .header-orb-2 {
      position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(27,79,138,.28) 0%, transparent 70%);
      width: 200px; height: 200px; bottom: -30%; left: -8%;
    }
    .greeting-row { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
    .greeting-label { color: rgba(210,190,140,.7); font-size: .8125rem; font-weight: 400; }
    .greeting-name  { color: #fff; font-size: 1.25rem; font-weight: 700; letter-spacing: -.01em; margin: .1rem 0 0; }
    .avatar-btn {
      width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #C9920D, #A37510);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .8125rem; font-weight: 700;
      text-decoration: none; border: 2px solid rgba(255,255,255,.2);
      box-shadow: 0 2px 8px rgba(201,146,13,.4);
    }

    /* ── Quick actions ── */
    .quick-actions {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem;
      margin-top: 1.25rem; position: relative; z-index: 1;
    }
    .qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: .375rem;
      background: rgba(255,255,255,.08); border: none; border-radius: 14px;
      padding: .75rem .5rem; cursor: pointer; text-decoration: none;
      transition: background .2s;
    }
    .qa-btn:hover { background: rgba(255,255,255,.13); }
    .qa-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .qa-label { color: rgba(226,232,240,.8); font-size: .625rem; font-weight: 600; white-space: nowrap; }

    /* ── Content area ── */
    .content { margin-top: -3rem; padding: 0 1rem 6rem; }

    /* ── Dispute alert ── */
    .dispute-alert {
      background: linear-gradient(135deg, #FEF3C7, #FDE68A);
      border: 1px solid #FCD34D;
      border-radius: 16px; padding: 1rem 1.125rem; margin-bottom: 1rem;
      display: flex; align-items: flex-start; gap: .75rem;
    }
    .alert-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #F59E0B; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .alert-title { color: #92400E; font-size: .875rem; font-weight: 700; }
    .alert-link { color: #B45309; font-size: .75rem; font-weight: 600; text-decoration: none; margin-top: .2rem; display: block; }
    .alert-link:hover { text-decoration: underline; }

    /* ── Section header ── */
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .875rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: #0F172A; letter-spacing: -.01em; }
    .see-all { font-size: .8125rem; font-weight: 600; color: #1B4F8A; text-decoration: none; }
    .see-all:hover { text-decoration: underline; }

    /* ── Transaction card ── */
    .tx-list { display: flex; flex-direction: column; gap: .5rem; }
    .tx-card {
      display: flex; align-items: center; gap: .875rem;
      background: #fff; border-radius: 18px; padding: 1rem 1.125rem;
      box-shadow: 0 1px 4px rgba(15,23,42,.06), 0 4px 12px rgba(15,23,42,.04);
      text-decoration: none;
      transition: box-shadow .2s, transform .15s;
    }
    .tx-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,.1); transform: translateY(-1px); }
    .tx-avatar {
      width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px;
      background: linear-gradient(135deg, #E5EEF8, #C8DCF2);
      display: flex; align-items: center; justify-content: center;
      color: #1B4F8A; font-size: 1rem; font-weight: 700;
    }
    .tx-ref   { font-size: .875rem; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tx-name  { font-size: .75rem; color: #64748B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: .1rem; }
    .tx-amount{ font-size: .9375rem; font-weight: 700; color: #0F172A; white-space: nowrap; }
    .tx-right { text-align: right; flex-shrink: 0; }

    /* ── Skeleton ── */
    .skeleton-card {
      background: #fff; border-radius: 18px; padding: 1rem 1.125rem;
      display: flex; align-items: center; gap: .875rem; margin-bottom: .5rem;
      box-shadow: 0 1px 4px rgba(15,23,42,.06);
    }
    .sk { border-radius: 8px; }
    .sk-circle { border-radius: 14px; }

    /* ── Empty ── */
    .empty-box {
      background: #fff; border-radius: 18px; padding: 3rem 1.5rem;
      text-align: center;
      box-shadow: 0 1px 4px rgba(15,23,42,.06);
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: .75rem; }
    .empty-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0 0 .25rem; }
    .empty-sub   { font-size: .875rem; color: #94A3B8; margin: 0; }
  `],
  template: `
    <div class="page">

      <!-- Dark header -->
      <div class="header animate-fade">
        <div class="header-orb orb-1"></div>
        <div class="header-orb-2 orb-2"></div>

        <!-- Greeting row -->
        <div class="greeting-row">
          <div>
            <div class="greeting-label">{{ 'dashboard.greeting' | translate }},</div>
            <div class="greeting-name">{{ auth.fullName() }}</div>
          </div>
          <a routerLink="/profile" class="avatar-btn">{{ auth.initials() }}</a>
        </div>

        <!-- Quick actions -->
        <div class="quick-actions">
          <a routerLink="/escrow" class="qa-btn">
            <div class="qa-icon" style="background:rgba(27,79,138,.25)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
              </svg>
            </div>
            <span class="qa-label">{{ 'dashboard.quickActions.transactions' | translate }}</span>
          </a>
          <a routerLink="/payouts/new" class="qa-btn">
            <div class="qa-icon" style="background:rgba(16,185,129,.2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/>
              </svg>
            </div>
            <span class="qa-label">{{ 'dashboard.quickActions.withdrawal' | translate }}</span>
          </a>
          <a routerLink="/wallet" class="qa-btn">
            <div class="qa-icon" style="background:rgba(245,158,11,.2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <span class="qa-label">{{ 'dashboard.quickActions.wallet' | translate }}</span>
          </a>
          <a routerLink="/disputes" class="qa-btn">
            <div class="qa-icon" style="background:rgba(239,68,68,.18)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span class="qa-label">{{ 'dashboard.quickActions.disputes' | translate }}</span>
          </a>
        </div>
      </div>

      <!-- Content -->
      <div class="content animate-entry">

        <!-- Disputes alert -->
        @if (disputes().length > 0) {
          <div class="dispute-alert">
            <div class="alert-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div class="alert-title">{{ 'dashboard.disputeAlert' | translate:{ count: disputes().length } }}</div>
              <a routerLink="/disputes" class="alert-link">{{ 'dashboard.viewDisputes' | translate }}</a>
            </div>
          </div>
        }

        <!-- Transactions -->
        <div class="section-header">
          <span class="section-title">{{ 'dashboard.recentTransactions' | translate }}</span>
          <a routerLink="/escrow" class="see-all">{{ 'dashboard.viewAll' | translate }}</a>
        </div>

        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="sk-circle skeleton-shimmer" style="width:44px;height:44px;flex-shrink:0"></div>
              <div style="flex:1">
                <div class="sk skeleton-shimmer" style="height:13px;width:65%;margin-bottom:8px"></div>
                <div class="sk skeleton-shimmer" style="height:11px;width:40%"></div>
              </div>
              <div class="sk skeleton-shimmer" style="width:60px;height:13px"></div>
            </div>
          }
        } @else if (transactions().length === 0) {
          <div class="empty-box">
            <div class="empty-icon">📋</div>
            <p class="empty-title">{{ 'dashboard.noTransactions' | translate }}</p>
            <p class="empty-sub">{{ 'escrow.empty.message' | translate }}</p>
          </div>
        } @else {
          <div class="tx-list">
            @for (tx of transactions(); track tx.id) {
              <a [routerLink]="['/escrow', tx.id]" class="tx-card">
                <div class="tx-avatar">{{ (tx.counterpartName || '?')[0].toUpperCase() }}</div>
                <div style="flex:1;min-width:0">
                  <div class="tx-ref">{{ tx.reference }}</div>
                  <div class="tx-name">{{ tx.counterpartName }}</div>
                </div>
                <div class="tx-right">
                  <div class="tx-amount">{{ tx.amount | amount }}</div>
                  <app-status-badge [status]="tx.status" />
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly transactions = signal<TransactionSummary[]>([]);
  protected readonly disputes = signal<DisputeSummary[]>([]);

  ngOnInit(): void {
    forkJoin({
      transactions: this.http.get<{ content: TransactionSummary[] }>(
        `${environment.apiUrl}/api/escrow?status=LOCKED,SHIPPED&limit=5&page=0&size=5`,
        { withCredentials: true },
      ),
      disputes: this.http.get<{ content: DisputeSummary[] }>(
        `${environment.apiUrl}/api/disputes?status=OPENED&limit=3&page=0&size=3`,
        { withCredentials: true },
      ),
    }).subscribe({
      next: (data) => {
        this.transactions.set(data.transactions?.content ?? []);
        this.disputes.set(data.disputes?.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
