import { Component, inject, signal, OnInit } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../core/auth/auth.store';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '@ngx-translate/core';
import {LangSwitcherComponent} from '@shared/components/lang-switcher/lang-switcher.component';

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
  reason: string;
  status: string;
  createdAt: string;
}

interface WalletInfo {
  available: number;
  frozen: number;
  currency: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AmountPipe, StatusBadgeComponent, DatePipe, TranslatePipe, LangSwitcherComponent],
  styles: [`
    /* ─── Shared ───────────────────────────────────── */
    :host { display: block; height: 100%; overflow-y: auto; }

    /* ─── MOBILE layout ────────────────────────────── */
    .mobile-view  { display: block; }
    .desktop-view { display: none;  }

    @media (min-width: 768px) {
      .mobile-view  { display: none;  }
      .desktop-view { display: flex; flex-direction: column; min-height: 100%; background: #F5F6FA; }
    }

    /* ── Mobile: dark header ── */
    .m-header {
      background: #0F2240;
      padding: 1.25rem 1.25rem 4.5rem;
      position: relative; overflow: hidden;
    }
    .m-orb {
      position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(201,146,13,.22) 0%, transparent 70%);
      width: 320px; height: 320px; top: -50%; right: -12%;
    }
    .m-orb2 {
      position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(27,79,138,.28) 0%, transparent 70%);
      width: 200px; height: 200px; bottom: -30%; left: -8%;
    }
    .m-greeting-row {
      display: flex; align-items: center; justify-content: space-between;
      position: relative; z-index: 1;
    }
    .m-label  { color: rgba(210,190,140,.7); font-size: .8125rem; }
    .m-name   { color: #fff; font-size: 1.25rem; font-weight: 700; letter-spacing: -.01em; margin: .1rem 0 0; }
    .m-avatar {
      width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg,#C9920D,#A37510);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .8125rem; font-weight: 700;
      text-decoration: none; border: 2px solid rgba(255,255,255,.2);
      box-shadow: 0 2px 8px rgba(201,146,13,.4);
    }
    .m-qa {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: .5rem; margin-top: 1.25rem; position: relative; z-index: 1;
    }
    .m-qa-btn {
      display: flex; flex-direction: column; align-items: center; gap: .375rem;
      background: rgba(255,255,255,.08); border: none; border-radius: 14px;
      padding: .75rem .5rem; cursor: pointer; text-decoration: none; transition: background .2s;
    }
    .m-qa-btn:hover { background: rgba(255,255,255,.13); }
    .m-qa-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .m-qa-label { color: rgba(226,232,240,.8); font-size: .625rem; font-weight: 600; white-space: nowrap; }

    .m-content { margin-top: -3rem; padding: 0 1rem 6rem; }

    .m-alert {
      background: linear-gradient(135deg,#FEF3C7,#FDE68A);
      border: 1px solid #FCD34D; border-radius: 16px;
      padding: 1rem 1.125rem; margin-bottom: 1rem;
      display: flex; align-items: flex-start; gap: .75rem;
    }
    .m-alert-icon {
      width: 36px; height: 36px; flex-shrink: 0; background: #F59E0B;
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
    }
    .m-alert-title { color: #92400E; font-size: .875rem; font-weight: 700; }
    .m-alert-link  {
      color: #B45309; font-size: .75rem; font-weight: 600;
      text-decoration: none; margin-top: .2rem; display: block;
    }
    .m-section-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: .875rem; }
    .m-section-title { font-size: 1rem; font-weight: 700; color: #a0a2a6; }
    .m-see-all { font-size: .8125rem; font-weight: 600; color: #1B4F8A; text-decoration: none; }
    .m-tx-card {
      display: flex; align-items: center; gap: .875rem;
      background: #fff; border-radius: 18px; padding: 1rem 1.125rem;
      box-shadow: 0 1px 4px rgba(15,23,42,.06),0 4px 12px rgba(15,23,42,.04);
      text-decoration: none; transition: box-shadow .2s,transform .15s; margin-bottom: .5rem;
    }
    .m-tx-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,.1); transform: translateY(-1px); }
    .m-tx-av {
      width: 44px; height: 44px; flex-shrink: 0; border-radius: 14px;
      background: linear-gradient(135deg,#E5EEF8,#C8DCF2);
      display: flex; align-items: center; justify-content: center;
      color: #1B4F8A; font-size: 1rem; font-weight: 700;
    }
    .m-tx-ref  { font-size: .875rem; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .m-tx-name { font-size: .75rem; color: #64748B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: .1rem; }
    .m-tx-amt  { font-size: .9375rem; font-weight: 700; color: #0F172A; white-space: nowrap; }

    /* ─── DESKTOP layout ────────────────────────────── */

    /* Top bar */
    .d-topbar {
      position: sticky; top: 0; z-index: 20;
      background: #fff; border-bottom: 1px solid #E8ECF2;
      padding: .875rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
    }
    .d-greeting   { font-size: 1.0625rem; color: #374151; }
    .d-greeting strong { color: #0F2240; }
    .d-topbar-right { display: flex; align-items: center; gap: 1.25rem; }
    .d-date { font-size: .8125rem; color: #94A3B8; font-weight: 500; }
    .d-topbar-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: #F5F6FA; border: 1px solid #E8ECF2;
      display: flex; align-items: center; justify-content: center;
      color: #64748B; cursor: pointer; transition: background .15s;
      text-decoration: none;
    }
    .d-topbar-icon:hover { background: #EDF1F7; }
    .d-avatar-btn {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg,#C9920D,#A37510);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: .75rem; font-weight: 700;
      text-decoration: none; border: 2px solid rgba(201,146,13,.3);
      box-shadow: 0 2px 8px rgba(201,146,13,.35);
    }

    /* Main area */
    .d-main { flex: 1; padding: 1.75rem 2rem 2rem; overflow-y: auto; }

    /* Page title */
    .d-page-title { margin-bottom: 1.5rem; }
    .d-page-title h1 { font-size: 1.375rem; font-weight: 700; color: #0F2240; margin: 0 0 .25rem; }
    .d-page-title p  { font-size: .875rem; color: #94A3B8; margin: 0; }

    /* KPI grid */
    .d-kpi-grid {
      display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem;
    }
    .d-kpi-card {
      background: #fff; border: 1px solid #E8ECF2; border-radius: 16px;
      padding: 1.25rem 1.375rem;
      box-shadow: 0 1px 3px rgba(15,23,42,.05),0 4px 10px rgba(15,23,42,.04);
      transition: box-shadow .2s, transform .15s;
    }
    .d-kpi-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,.09); transform: translateY(-2px); }
    .d-kpi-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: .875rem; }
    .d-kpi-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .d-kpi-icon--blue   { background: #EBF4FF; color: #1B4F8A; }
    .d-kpi-icon--green  { background: #ECFDF5; color: #059669; }
    .d-kpi-icon--red    { background: #FEF2F2; color: #DC2626; }
    .d-kpi-icon--amber  { background: #FFFBEB; color: #D97706; }
    .d-kpi-trend {
      font-size: .6875rem; font-weight: 600; padding: .2rem .5rem;
      border-radius: 99px; white-space: nowrap;
    }
    .d-kpi-trend--up   { background: #ECFDF5; color: #059669; }
    .d-kpi-trend--warn { background: #FEF3C7; color: #D97706; }
    .d-kpi-label { font-size: .8125rem; color: #64748B; font-weight: 500; margin-bottom: .375rem; }
    .d-kpi-value { font-size: 1.75rem; font-weight: 800; color: #0F2240; letter-spacing: -.02em; line-height: 1; }
    .d-kpi-sub   { font-size: .75rem; color: #94A3B8; margin-top: .375rem; }

    /* Content grid */
    .d-content-grid {
      display: grid; grid-template-columns: 1fr 360px; gap: 1rem; align-items: start;
    }

    /* Table card */
    .d-card {
      background: #fff; border: 1px solid #E8ECF2; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(15,23,42,.05);
      overflow: hidden;
    }
    .d-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.125rem 1.375rem;
      border-bottom: 1px solid #F1F5F9;
    }
    .d-card-header h2 { font-size: 1rem; font-weight: 700; color: #0F2240; margin: 0; }
    .d-see-all { font-size: .8125rem; font-weight: 600; color: #1B4F8A; text-decoration: none; }
    .d-see-all:hover { text-decoration: underline; }

    /* Table */
    .d-table { width: 100%; border-collapse: collapse; }
    .d-table thead th {
      font-size: .75rem; font-weight: 600; color: #64748B; text-transform: uppercase;
      letter-spacing: .04em; padding: .75rem 1.375rem; text-align: left;
      background: #F8FAFC; border-bottom: 1px solid #E8ECF2;
    }
    .d-table tbody tr {
      border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background .15s;
    }
    .d-table tbody tr:last-child { border-bottom: none; }
    .d-table tbody tr:hover { background: #F8FAFC; }
    .d-table tbody td { padding: .875rem 1.375rem; font-size: .875rem; color: #374151; }
    .d-tx-counterpart { display: flex; align-items: center; gap: .625rem; }
    .d-tx-av {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      background: linear-gradient(135deg,#E5EEF8,#C8DCF2);
      display: flex; align-items: center; justify-content: center;
      color: #1B4F8A; font-size: .75rem; font-weight: 700;
    }
    .d-tx-ref  { font-weight: 600; color: #0F2240; }
    .d-tx-amt  { font-weight: 700; color: #0F2240; white-space: nowrap; }
    .d-tx-date { color: #94A3B8; font-size: .8125rem; }

    /* Right panel */
    .d-right-panel { display: flex; flex-direction: column; gap: 1rem; }

    /* Dispute rows */
    .d-dispute-row {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .875rem 1.375rem; border-bottom: 1px solid #F1F5F9;
      text-decoration: none; transition: background .15s; cursor: pointer;
    }
    .d-dispute-row:last-child { border-bottom: none; }
    .d-dispute-row:hover { background: #FEF2F2; }
    .d-dispute-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #DC2626;
      flex-shrink: 0; margin-top: .3rem;
    }
    .d-dispute-ref  { font-size: .875rem; font-weight: 600; color: #0F2240; }
    .d-dispute-meta { font-size: .75rem; color: #94A3B8; margin-top: .125rem; }

    /* Quick actions grid */
    .d-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .625rem; padding: 1rem 1.375rem; }
    .d-quick-btn {
      display: flex; flex-direction: column; align-items: center; gap: .375rem;
      background: #F8FAFC; border: 1px solid #E8ECF2; border-radius: 12px;
      padding: .875rem .5rem; text-decoration: none; transition: all .15s; cursor: pointer;
    }
    .d-quick-btn:hover { background: #EBF4FF; border-color: #93C5FD; }
    .d-quick-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .d-quick-label { font-size: .6875rem; font-weight: 600; color: #374151; text-align: center; }

    /* Skeleton */
    .sk { border-radius: 8px; }
    .sk-row { display: flex; align-items: center; gap: .875rem; padding: .875rem 1.375rem; border-bottom: 1px solid #F1F5F9; }

    /* Empty */
    .d-empty { padding: 3rem 1.5rem; text-align: center; }
    .d-empty-icon { font-size: 2rem; margin-bottom: .5rem; }
    .d-empty-title { font-size: .9375rem; font-weight: 700; color: #0F172A; margin: 0 0 .25rem; }
    .d-empty-sub   { font-size: .8125rem; color: #94A3B8; margin: 0; }
  `],
  template: `
    <!-- ════════════ MOBILE ════════════ -->
    <div class="mobile-view">
      <div class="m-header">
        <div class="m-orb"></div>
        <div class="m-orb2"></div>
        <div class="m-greeting-row">
          <div>
            <div class="m-label">{{ 'dashboard.greeting' | translate }},</div>
            <div class="m-name">{{ auth.fullName() }}</div>
          </div>
          <a routerLink="/profile" class="m-avatar">{{ auth.initials() }}</a>
        </div>
        <div class="m-qa">
          <a routerLink="/escrow" class="m-qa-btn">
            <div class="m-qa-icon" style="background:rgba(27,79,138,.25)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
              </svg>
            </div>
            <span class="m-qa-label">{{ 'dashboard.quickActions.transactions' | translate }}</span>
          </a>
          <a routerLink="/payouts/new" class="m-qa-btn">
            <div class="m-qa-icon" style="background:rgba(16,185,129,.2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 12l-4-4-4 4M12 16V8"/>
              </svg>
            </div>
            <span class="m-qa-label">{{ 'dashboard.quickActions.withdrawal' | translate }}</span>
          </a>
          <a routerLink="/wallet" class="m-qa-btn">
            <div class="m-qa-icon" style="background:rgba(245,158,11,.2)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <span class="m-qa-label">{{ 'dashboard.quickActions.wallet' | translate }}</span>
          </a>
          <a routerLink="/disputes" class="m-qa-btn">
            <div class="m-qa-icon" style="background:rgba(239,68,68,.18)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span class="m-qa-label">{{ 'dashboard.quickActions.disputes' | translate }}</span>
          </a>
        </div>
      </div>

      <div class="m-content">
        @if (disputes().length > 0) {
          <div class="m-alert">
            <div class="m-alert-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div class="m-alert-title">{{ 'dashboard.disputeAlert' | translate:{count: disputes().length} }}</div>
              <a routerLink="/disputes" class="m-alert-link">{{ 'dashboard.viewDisputes' | translate }}</a>
            </div>
          </div>
        }
        <div class="m-section-row">
          <span class="m-section-title">{{ 'dashboard.recentTransactions' | translate }}</span>
          <a routerLink="/escrow" class="m-see-all">{{ 'dashboard.viewAll' | translate }}</a>
        </div>
        @for (tx of transactions(); track tx.id) {
          <a [routerLink]="['/escrow', tx.id]" class="m-tx-card">
            <div class="m-tx-av">{{ (tx.counterpartName || '?')[0].toUpperCase() }}</div>
            <div style="flex:1;min-width:0">
              <div class="m-tx-ref">{{ tx.reference }}</div>
              <div class="m-tx-name">{{ tx.counterpartName }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="m-tx-amt">{{ tx.amount | amount }}</div>
              <app-status-badge [status]="tx.status"/>
            </div>
          </a>
        }
      </div>
    </div>

    <!-- ════════════ DESKTOP ════════════ -->
    <div class="desktop-view">

      <!-- Top bar -->
      <div class="d-topbar">
        <div class="d-greeting">
          {{ 'dashboard.greeting' | translate }},&nbsp;<strong>{{ auth.fullName() }}</strong>&nbsp;🌟
        </div>
        <div class="d-topbar-right">

          <!-- Lang switcher -->
          <div style="padding:.5rem .75rem 0">
            <app-lang-switcher class="font-bold forced-colors:black -mt-3"/>
          </div>

          <span class="d-date">{{ today | date:'dd MMMM yyyy · HH:mm' }}</span>

          <!-- Wallet -->
          <a routerLink="/wallet" class="d-topbar-icon" title="Portefeuille">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </a>
          <!-- Litiges -->
          <a routerLink="/disputes" class="d-topbar-icon" title="Litiges"
             [style.background]="disputes().length > 0 ? '#FEF2F2' : ''"
             [style.color]="disputes().length > 0 ? '#DC2626' : ''">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </a>
          <!-- Avatar -->
          <a routerLink="/profile" class="d-avatar-btn">{{ auth.initials() }}</a>
        </div>
      </div>

      <!-- Main scrollable area -->
      <div class="d-main">

        <!-- Page title -->
        <div class="d-page-title">
          <h1>{{ 'nav.dashboard' | translate }}</h1>
          <p>{{ 'dashboard.subtitle' | translate }}</p>
        </div>

        <!-- KPI Cards -->
        <div class="d-kpi-grid">

          <!-- Solde disponible -->
          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              @if (wallet()) {
                <span class="d-kpi-trend d-kpi-trend--up">Disponible</span>
              }
            </div>
            <div class="d-kpi-label">{{ 'dashboard.balance' | translate }}</div>
            <div class="d-kpi-value">
              @if (wallet()) {
                {{ wallet()!.available | amount }}
              } @else {
                —
              }
            </div>
            @if (wallet()?.frozen) {
              <div class="d-kpi-sub">Gelé : {{ wallet()!.frozen | amount }}</div>
            }
          </div>

          <!-- Transactions actives -->
          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                </svg>
              </div>
              <span class="d-kpi-trend d-kpi-trend--up">En cours</span>
            </div>
            <div class="d-kpi-label">Transactions actives</div>
            <div class="d-kpi-value">{{ transactions().length }}</div>
            <div class="d-kpi-sub">Bloquées ou en livraison</div>
          </div>

          <!-- Litiges en cours -->
          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              @if (disputes().length > 0) {
                <span class="d-kpi-trend d-kpi-trend--warn">À traiter</span>
              }
            </div>
            <div class="d-kpi-label">Litiges en cours</div>
            <div class="d-kpi-value">{{ disputes().length }}</div>
            <div class="d-kpi-sub">Ouverts et en attente</div>
          </div>

          <!-- Montant en attente -->
          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span class="d-kpi-trend d-kpi-trend--up">En attente</span>
            </div>
            <div class="d-kpi-label">Montant à recevoir</div>
            <div class="d-kpi-value">{{ pendingAmount() | amount }}</div>
            <div class="d-kpi-sub">Sur {{ transactions().length }} transaction(s)</div>
          </div>

        </div>

        <!-- Content grid -->
        <div class="d-content-grid">

          <!-- Transactions table -->
          <div class="d-card">
            <div class="d-card-header">
              <h2>{{ 'dashboard.recentTransactions' | translate }}</h2>
              <a routerLink="/escrow" class="d-see-all">{{ 'dashboard.viewAll' | translate }} →</a>
            </div>

            @if (loading()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="sk-row">
                  <div class="sk skeleton-shimmer" style="width:32px;height:32px;border-radius:9px;flex-shrink:0"></div>
                  <div style="flex:1">
                    <div class="sk skeleton-shimmer" style="height:12px;width:50%;margin-bottom:6px"></div>
                    <div class="sk skeleton-shimmer" style="height:10px;width:30%"></div>
                  </div>
                  <div class="sk skeleton-shimmer" style="width:70px;height:12px"></div>
                </div>
              }
            } @else if (transactions().length === 0) {
              <div class="d-empty">
                <div class="d-empty-icon">📋</div>
                <p class="d-empty-title">{{ 'dashboard.noTransactions' | translate }}</p>
                <p class="d-empty-sub">{{ 'escrow.empty.message' | translate }}</p>
              </div>
            } @else {
              <table class="d-table">
                <thead>
                <tr>
                  <th>Date</th>
                  <th>Référence</th>
                  <th>Contrepartie</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
                </thead>
                <tbody>
                  @for (tx of transactions(); track tx.id) {
                    <tr (click)="router.navigate(['/escrow', tx.id])">
                      <td class="d-tx-date">{{ tx.createdAt | date:'dd/MM/yy' }}</td>
                      <td class="d-tx-ref">{{ tx.reference }}</td>
                      <td>
                        <div class="d-tx-counterpart">
                          <div class="d-tx-av">{{ (tx.counterpartName || '?')[0].toUpperCase() }}</div>
                          {{ tx.counterpartName }}
                        </div>
                      </td>
                      <td class="d-tx-amt">{{ tx.amount | amount }}</td>
                      <td>
                        <app-status-badge [status]="tx.status"/>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- Right panel -->
          <div class="d-right-panel">

            <!-- Active disputes -->
            <div class="d-card">
              <div class="d-card-header">
                <h2>Litiges en cours</h2>
                <a routerLink="/disputes" class="d-see-all">Voir tout →</a>
              </div>
              @if (disputes().length === 0) {
                <div class="d-empty" style="padding:1.5rem">
                  <div class="d-empty-icon">✅</div>
                  <p class="d-empty-title" style="font-size:.875rem">Aucun litige actif</p>
                </div>
              } @else {
                @for (d of disputes(); track d.id) {
                  <a [routerLink]="['/disputes', d.id]" class="d-dispute-row">
                    <div class="d-dispute-dot"></div>
                    <div>
                      <div class="d-dispute-ref">{{ d.transactionRef }}</div>
                      <div class="d-dispute-meta">{{ d.reason }} ·
                        <app-status-badge [status]="d.status"/>
                      </div>
                    </div>
                  </a>
                }
              }
            </div>

            <!-- Quick actions -->
            <div class="d-card">
              <div class="d-card-header"><h2>Actions rapides</h2></div>
              <div class="d-quick-grid">
                <a routerLink="/escrow" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#EBF4FF;color:#1B4F8A">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
                    </svg>
                  </div>
                  <span class="d-quick-label">Transactions</span>
                </a>
                <a routerLink="/payouts/new" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#ECFDF5;color:#059669">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M16 12l-4-4-4 4M12 16V8"/>
                    </svg>
                  </div>
                  <span class="d-quick-label">Retrait</span>
                </a>
                <a routerLink="/wallet" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#FFFBEB;color:#D97706">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  </div>
                  <span class="d-quick-label">Portefeuille</span>
                </a>
                <a routerLink="/disputes" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#FEF2F2;color:#DC2626">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <span class="d-quick-label">Litiges</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly auth   = inject(AuthStore);
  private  readonly http    = inject(HttpClient);
  protected readonly router = inject(Router);

  protected readonly today        = new Date();
  protected readonly loading      = signal(true);
  protected readonly transactions = signal<TransactionSummary[]>([]);
  protected readonly disputes     = signal<DisputeSummary[]>([]);
  protected readonly wallet       = signal<WalletInfo | null>(null);

  protected readonly pendingAmount = () =>
    this.transactions().reduce((sum, tx) => sum + (tx.amount ?? 0), 0);

  ngOnInit(): void {
    forkJoin({
      transactions: this.http.get<{ content: TransactionSummary[] }>(
        `${environment.apiUrl}/api/escrow?status=LOCKED,SHIPPED,INITIATED&page=0&size=5`,
        { withCredentials: true },
      ),
      disputes: this.http.get<{ content: DisputeSummary[] }>(
        `${environment.apiUrl}/api/disputes?status=OPENED&page=0&size=5`,
        { withCredentials: true },
      ),
      wallet: this.http.get<WalletInfo>(
        `${environment.apiUrl}/api/wallet`,
        { withCredentials: true },
      ).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ transactions, disputes, wallet }) => {
        this.transactions.set(transactions?.content ?? []);
        this.disputes.set(disputes?.content ?? []);
        this.wallet.set(wallet);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
