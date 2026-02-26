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
    :host { display: block; height: 100%; overflow-y: auto; }

    /* ─── DESKTOP layout ────────────────────────────── */
    .d-topbar {
      position: sticky; top: 0; z-index: 20;
      background: #fff; border-bottom: 1px solid #E8ECF2;
      padding: .875rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
    }
    .d-greeting { font-size: 1.0625rem; color: #374151; }
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
    .d-main { flex: 1; padding: 1.75rem 2rem 2rem; overflow-y: auto; }
    .d-page-title { margin-bottom: 1.5rem; }
    .d-page-title h1 { font-size: 1.375rem; font-weight: 700; color: #0F2240; margin: 0 0 .25rem; }
    .d-page-title p  { font-size: .875rem; color: #94A3B8; margin: 0; }
    .d-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .d-kpi-card {
      background: #fff; border: 1px solid #E8ECF2; border-radius: 16px;
      padding: 1.25rem 1.375rem;
      box-shadow: 0 1px 3px rgba(15,23,42,.05),0 4px 10px rgba(15,23,42,.04);
      transition: box-shadow .2s, transform .15s;
    }
    .d-kpi-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,.09); transform: translateY(-2px); }
    .d-kpi-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: .875rem; }
    .d-kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .d-kpi-icon--blue  { background: #EBF4FF; color: #1B4F8A; }
    .d-kpi-icon--green { background: #ECFDF5; color: #059669; }
    .d-kpi-icon--red   { background: #FEF2F2; color: #DC2626; }
    .d-kpi-icon--amber { background: #FFFBEB; color: #D97706; }
    .d-kpi-trend { font-size: .6875rem; font-weight: 600; padding: .2rem .5rem; border-radius: 99px; white-space: nowrap; }
    .d-kpi-trend--up   { background: #ECFDF5; color: #059669; }
    .d-kpi-trend--warn { background: #FEF3C7; color: #D97706; }
    .d-kpi-label { font-size: .8125rem; color: #64748B; font-weight: 500; margin-bottom: .375rem; }
    .d-kpi-value { font-size: 1.75rem; font-weight: 800; color: #0F2240; letter-spacing: -.02em; line-height: 1; }
    .d-kpi-sub   { font-size: .75rem; color: #94A3B8; margin-top: .375rem; }
    .d-content-grid { display: grid; grid-template-columns: 1fr 360px; gap: 1rem; align-items: start; }
    .d-card { background: #fff; border: 1px solid #E8ECF2; border-radius: 16px; box-shadow: 0 1px 3px rgba(15,23,42,.05); overflow: hidden; }
    .d-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.375rem; border-bottom: 1px solid #F1F5F9; }
    .d-card-header h2 { font-size: 1rem; font-weight: 700; color: #0F2240; margin: 0; }
    .d-see-all { font-size: .8125rem; font-weight: 600; color: #1B4F8A; text-decoration: none; }
    .d-see-all:hover { text-decoration: underline; }
    .d-table { width: 100%; border-collapse: collapse; }
    .d-table thead th {
      font-size: .75rem; font-weight: 600; color: #64748B; text-transform: uppercase;
      letter-spacing: .04em; padding: .75rem 1.375rem; text-align: left;
      background: #F8FAFC; border-bottom: 1px solid #E8ECF2;
    }
    .d-table tbody tr { border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background .15s; }
    .d-table tbody tr:last-child { border-bottom: none; }
    .d-table tbody tr:hover { background: #F8FAFC; }
    .d-table tbody td { padding: .875rem 1.375rem; font-size: .875rem; color: #374151; }
    .d-tx-counterpart { display: flex; align-items: center; gap: .625rem; }
    .d-tx-av { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; background: linear-gradient(135deg,#E5EEF8,#C8DCF2); display: flex; align-items: center; justify-content: center; color: #1B4F8A; font-size: .75rem; font-weight: 700; }
    .d-tx-ref  { font-weight: 600; color: #0F2240; }
    .d-tx-amt  { font-weight: 700; color: #0F2240; white-space: nowrap; }
    .d-tx-date { color: #94A3B8; font-size: .8125rem; }
    .d-right-panel { display: flex; flex-direction: column; gap: 1rem; }
    .d-dispute-row { display: flex; align-items: flex-start; gap: .75rem; padding: .875rem 1.375rem; border-bottom: 1px solid #F1F5F9; text-decoration: none; transition: background .15s; cursor: pointer; }
    .d-dispute-row:last-child { border-bottom: none; }
    .d-dispute-row:hover { background: #FEF2F2; }
    .d-dispute-dot { width: 8px; height: 8px; border-radius: 50%; background: #DC2626; flex-shrink: 0; margin-top: .3rem; }
    .d-dispute-ref  { font-size: .875rem; font-weight: 600; color: #0F2240; }
    .d-dispute-meta { font-size: .75rem; color: #94A3B8; margin-top: .125rem; }
    .d-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .625rem; padding: 1rem 1.375rem; }
    .d-quick-btn { display: flex; flex-direction: column; align-items: center; gap: .375rem; background: #F8FAFC; border: 1px solid #E8ECF2; border-radius: 12px; padding: .875rem .5rem; text-decoration: none; transition: all .15s; cursor: pointer; }
    .d-quick-btn:hover { background: #EBF4FF; border-color: #93C5FD; }
    .d-quick-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .d-quick-label { font-size: .6875rem; font-weight: 600; color: #374151; text-align: center; }
    .sk { border-radius: 8px; }
    .sk-row { display: flex; align-items: center; gap: .875rem; padding: .875rem 1.375rem; border-bottom: 1px solid #F1F5F9; }
    .d-empty { padding: 3rem 1.5rem; text-align: center; }
    .d-empty-icon { font-size: 2rem; margin-bottom: .5rem; }
    .d-empty-title { font-size: .9375rem; font-weight: 700; color: #0F172A; margin: 0 0 .25rem; }
    .d-empty-sub   { font-size: .8125rem; color: #94A3B8; margin: 0; }
  `],
  template: `

    <!-- ════════════ MOBILE (hidden on md+) ════════════ -->
    <div class="md:hidden flex flex-col min-h-full bg-page">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div class="text-sm text-gray-700 font-medium truncate">
          {{ 'dashboard.greeting' | translate }},&nbsp;<strong class="text-dark">{{ auth.fullName() }}</strong>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <app-lang-switcher />
          <a routerLink="/wallet"
             class="w-8 h-8 rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 no-underline transition-colors hover:bg-page"
             [title]="'nav.wallet' | translate">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </a>
          <a routerLink="/disputes"
             class="w-8 h-8 rounded-[10px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 no-underline transition-colors"
             [class.bg-error-lt]="disputes().length > 0"
             [class.border-red-200]="disputes().length > 0"
             [class.text-error]="disputes().length > 0"
             [title]="'nav.disputes' | translate">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </a>
          <a routerLink="/profile"
             class="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dk flex items-center justify-center text-white text-xs font-bold no-underline border-2 border-[rgba(201,146,13,.3)] shadow-[0_2px_8px_rgba(201,146,13,.35)]">
            {{ auth.initials() }}
          </a>
        </div>
      </div>

      <div class="flex-1 px-4 py-5 pb-24">
        <!-- Page title -->
        <div class="mb-5">
          <h1 class="text-lg font-bold text-dark m-0 mb-0.5">{{ 'nav.dashboard' | translate }}</h1>
          <p class="text-sm text-slate-400 m-0">{{ 'dashboard.subtitle' | translate }}</p>
        </div>

        <!-- Dispute alert -->
        @if (disputes().length > 0) {
          <div class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 mb-5">
            <div class="w-8 h-8 shrink-0 bg-amber-500 rounded-[10px] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-amber-900">{{ 'dashboard.disputeAlert' | translate:{count: disputes().length} }}</div>
            </div>
            <a routerLink="/disputes" class="shrink-0 text-xs font-semibold text-amber-700 no-underline hover:underline">{{ 'dashboard.viewDisputes' | translate }} →</a>
          </div>
        }

        <!-- KPI Cards — 2 cols -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
            <div class="flex items-start justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-[#EBF4FF] text-primary flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              @if (wallet()) { <span class="text-[.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-success-lt text-success whitespace-nowrap">{{ 'dashboard.kpi.available' | translate }}</span> }
            </div>
            <div class="text-[.75rem] text-slate-500 font-medium mb-1">{{ 'dashboard.balance' | translate }}</div>
            <div class="text-xl font-extrabold text-dark tracking-[-0.02em] leading-none">
              @if (wallet()) { {{ wallet()!.available | amount }} } @else { — }
            </div>
            @if (wallet()?.frozen) { <div class="text-[.6875rem] text-slate-400 mt-1">{{ 'dashboard.kpi.frozen' | translate }} {{ wallet()!.frozen | amount }}</div> }
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
            <div class="flex items-start justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-success-lt text-success flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
              </div>
              <span class="text-[.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-success-lt text-success whitespace-nowrap">{{ 'status.IN_PROGRESS' | translate }}</span>
            </div>
            <div class="text-[.75rem] text-slate-500 font-medium mb-1">{{ 'nav.escrow' | translate }}</div>
            <div class="text-xl font-extrabold text-dark tracking-[-0.02em] leading-none">{{ transactions().length }}</div>
            <div class="text-[.6875rem] text-slate-400 mt-1">{{ 'dashboard.kpi.active' | translate }}</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
            <div class="flex items-start justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-error-lt text-error flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              @if (disputes().length > 0) { <span class="text-[.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">{{ 'dashboard.kpi.toProcess' | translate }}</span> }
            </div>
            <div class="text-[.75rem] text-slate-500 font-medium mb-1">{{ 'nav.disputes' | translate }}</div>
            <div class="text-xl font-extrabold text-dark tracking-[-0.02em] leading-none">{{ disputes().length }}</div>
            <div class="text-[.6875rem] text-slate-400 mt-1">{{ 'dashboard.kpi.pending' | translate }}</div>
          </div>

          <div class="bg-white border border-slate-200 rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
            <div class="flex items-start justify-between mb-3">
              <div class="w-9 h-9 rounded-xl bg-[#FFFBEB] text-amber-600 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span class="text-[.625rem] font-semibold px-1.5 py-0.5 rounded-full bg-success-lt text-success whitespace-nowrap">{{ 'dashboard.kpi.pending' | translate }}</span>
            </div>
            <div class="text-[.75rem] text-slate-500 font-medium mb-1">{{ 'dashboard.kpi.toReceive' | translate }}</div>
            <div class="text-xl font-extrabold text-dark tracking-[-0.02em] leading-none">{{ pendingAmount() | amount }}</div>
            <div class="text-[.6875rem] text-slate-400 mt-1">{{ 'dashboard.kpi.txCount' | translate:{count: transactions().length} }}</div>
          </div>
        </div>

        <!-- Transactions -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-base font-bold text-slate-500">{{ 'dashboard.recentTransactions' | translate }}</span>
          <a routerLink="/escrow" class="text-[.8125rem] font-semibold text-primary no-underline">{{ 'dashboard.viewAll' | translate }}</a>
        </div>
        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="flex items-center gap-3 bg-white rounded-[18px] p-4 mb-2 shadow-[0_1px_4px_rgba(15,23,42,.06)]">
              <div class="skeleton-shimmer rounded-[14px] w-11 h-11 shrink-0"></div>
              <div class="flex-1"><div class="skeleton-shimmer rounded h-3 w-1/2 mb-1.5"></div><div class="skeleton-shimmer rounded h-2.5 w-[30%]"></div></div>
              <div class="skeleton-shimmer rounded w-16 h-3"></div>
            </div>
          }
        } @else if (transactions().length === 0) {
          <div class="text-center py-10">
            <div class="text-3xl mb-2">📋</div>
            <p class="text-sm font-bold text-slate-900 m-0 mb-1">{{ 'dashboard.noTransactions' | translate }}</p>
            <p class="text-xs text-slate-400 m-0">{{ 'escrow.empty.message' | translate }}</p>
          </div>
        } @else {
          @for (tx of transactions(); track tx.id) {
            <a [routerLink]="['/escrow', tx.id]" class="flex items-center gap-3 bg-white rounded-[18px] p-4 mb-2 shadow-[0_1px_4px_rgba(15,23,42,.06),0_4px_12px_rgba(15,23,42,.04)] no-underline transition-all hover:shadow-[0_4px_16px_rgba(15,23,42,.1)] hover:-translate-y-px">
              <div class="w-11 h-11 shrink-0 rounded-[14px] bg-gradient-to-br from-primary-lt to-[#C8DCF2] flex items-center justify-center text-primary text-base font-bold">{{ (tx.counterpartName || '?')[0].toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-dark truncate">{{ tx.reference }}</div>
                <div class="text-xs text-slate-400 truncate mt-0.5">{{ tx.counterpartName }}</div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-[.9375rem] font-bold text-dark whitespace-nowrap">{{ tx.amount | amount }}</div>
                <app-status-badge [status]="tx.status"/>
              </div>
            </a>
          }
        }
      </div>
    </div>

    <!-- ════════════ DESKTOP (hidden on mobile) ════════════ -->
    <div class="hidden md:flex flex-col min-h-full" style="background:#F5F6FA">

      <!-- Top bar -->
      <div class="d-topbar">
        <div class="d-greeting">
          {{ 'dashboard.greeting' | translate }},&nbsp;<strong>{{ auth.fullName() }}</strong>&nbsp;🌟
        </div>
        <div class="d-topbar-right">
          <app-lang-switcher />
          <span class="d-date">{{ today | date:'dd MMMM yyyy · HH:mm' }}</span>
          <a routerLink="/wallet" class="d-topbar-icon" [title]="'nav.wallet' | translate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </a>
          <a routerLink="/disputes" class="d-topbar-icon" [title]="'nav.disputes' | translate"
             [style.background]="disputes().length > 0 ? '#FEF2F2' : ''"
             [style.color]="disputes().length > 0 ? '#DC2626' : ''">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </a>
          <a routerLink="/profile" class="d-avatar-btn">{{ auth.initials() }}</a>
        </div>
      </div>

      <!-- Main scrollable area -->
      <div class="d-main">

        <div class="d-page-title">
          <h1>{{ 'nav.dashboard' | translate }}</h1>
          <p>{{ 'dashboard.subtitle' | translate }}</p>
        </div>

        <!-- KPI Cards -->
        <div class="d-kpi-grid">
          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              @if (wallet()) { <span class="d-kpi-trend d-kpi-trend--up">{{ 'dashboard.kpi.available' | translate }}</span> }
            </div>
            <div class="d-kpi-label">{{ 'dashboard.balance' | translate }}</div>
            <div class="d-kpi-value">@if (wallet()) { {{ wallet()!.available | amount }} } @else { — }</div>
            @if (wallet()?.frozen) { <div class="d-kpi-sub">{{ 'dashboard.kpi.frozen' | translate }} {{ wallet()!.frozen | amount }}</div> }
          </div>

          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
              </div>
              <span class="d-kpi-trend d-kpi-trend--up">{{ 'status.IN_PROGRESS' | translate }}</span>
            </div>
            <div class="d-kpi-label">{{ 'dashboard.kpi.activeTransactions' | translate }}</div>
            <div class="d-kpi-value">{{ transactions().length }}</div>
            <div class="d-kpi-sub">{{ 'dashboard.kpi.lockedOrShipped' | translate }}</div>
          </div>

          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              @if (disputes().length > 0) { <span class="d-kpi-trend d-kpi-trend--warn">{{ 'dashboard.kpi.toProcess' | translate }}</span> }
            </div>
            <div class="d-kpi-label">{{ 'dashboard.kpi.activeDisputes' | translate }}</div>
            <div class="d-kpi-value">{{ disputes().length }}</div>
            <div class="d-kpi-sub">{{ 'dashboard.kpi.openPending' | translate }}</div>
          </div>

          <div class="d-kpi-card">
            <div class="d-kpi-top">
              <div class="d-kpi-icon d-kpi-icon--amber">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <span class="d-kpi-trend d-kpi-trend--up">{{ 'dashboard.kpi.pending' | translate }}</span>
            </div>
            <div class="d-kpi-label">{{ 'dashboard.kpi.amountToReceive' | translate }}</div>
            <div class="d-kpi-value">{{ pendingAmount() | amount }}</div>
            <div class="d-kpi-sub">{{ 'dashboard.kpi.onNTransactions' | translate:{count: transactions().length} }}</div>
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
              @for (i of [1,2,3,4]; track i) {
                <div class="sk-row">
                  <div class="sk skeleton-shimmer" style="width:32px;height:32px;border-radius:9px;flex-shrink:0"></div>
                  <div style="flex:1"><div class="sk skeleton-shimmer" style="height:12px;width:50%;margin-bottom:6px"></div><div class="sk skeleton-shimmer" style="height:10px;width:30%"></div></div>
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
                    <th>{{ 'dashboard.table.date' | translate }}</th>
                    <th>{{ 'escrow.detail.reference' | translate }}</th>
                    <th>{{ 'dashboard.table.counterpart' | translate }}</th>
                    <th>{{ 'escrow.detail.amount' | translate }}</th>
                    <th>{{ 'dashboard.table.status' | translate }}</th>
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
                      <td><app-status-badge [status]="tx.status"/></td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- Right panel -->
          <div class="d-right-panel">

            <div class="d-card">
              <div class="d-card-header">
                <h2>{{ 'dashboard.kpi.activeDisputes' | translate }}</h2>
                <a routerLink="/disputes" class="d-see-all">{{ 'dashboard.viewAll' | translate }} →</a>
              </div>
              @if (disputes().length === 0) {
                <div class="d-empty" style="padding:1.5rem">
                  <div class="d-empty-icon">✅</div>
                  <p class="d-empty-title" style="font-size:.875rem">{{ 'dashboard.noActiveDisputes' | translate }}</p>
                </div>
              } @else {
                @for (d of disputes(); track d.id) {
                  <a [routerLink]="['/disputes', d.id]" class="d-dispute-row">
                    <div class="d-dispute-dot"></div>
                    <div>
                      <div class="d-dispute-ref">{{ d.transactionRef }}</div>
                      <div class="d-dispute-meta">{{ d.reason }} · <app-status-badge [status]="d.status"/></div>
                    </div>
                  </a>
                }
              }
            </div>

            <div class="d-card">
              <div class="d-card-header"><h2>{{ 'dashboard.quickActions.title' | translate }}</h2></div>
              <div class="d-quick-grid">
                <a routerLink="/escrow" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#EBF4FF;color:#1B4F8A"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg></div>
                  <span class="d-quick-label">{{ 'dashboard.quickActions.transactions' | translate }}</span>
                </a>
                <a routerLink="/payouts/new" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#ECFDF5;color:#059669"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 16V8"/></svg></div>
                  <span class="d-quick-label">{{ 'dashboard.quickActions.withdrawal' | translate }}</span>
                </a>
                <a routerLink="/wallet" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#FFFBEB;color:#D97706"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
                  <span class="d-quick-label">{{ 'dashboard.quickActions.wallet' | translate }}</span>
                </a>
                <a routerLink="/disputes" class="d-quick-btn">
                  <div class="d-quick-icon" style="background:#FEF2F2;color:#DC2626"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                  <span class="d-quick-label">{{ 'dashboard.quickActions.disputes' | translate }}</span>
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
