import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { LangSwitcherComponent } from '@shared/components/lang-switcher/lang-switcher.component';

interface MenuItem { icon: string; label: string; sub?: string; route: string; danger?: boolean; }

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LangSwitcherComponent],
  template: `
    <div class="min-h-[100svh] bg-page animate-fade">

      <!-- ═══ MOBILE topbar (hidden on md+) ═══ -->
      <div class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 md:hidden">
        <div class="flex items-center gap-3 min-w-0">
          <a routerLink="/dashboard"
             class="w-9 h-9 rounded-[10px] bg-slate-100 flex items-center justify-center text-slate-600 no-underline shrink-0 transition-colors hover:bg-slate-200"
             aria-label="Retour accueil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <div class="min-w-0">
            <p class="text-[.6875rem] font-semibold uppercase tracking-[.07em] text-slate-400 m-0 leading-none mb-0.5">{{ 'profile.title' | translate }}</p>
            <h1 class="text-sm font-bold text-slate-900 m-0 truncate">{{ auth.fullName() }}</h1>
          </div>
        </div>
        <app-lang-switcher />
      </div>

      <!-- ═══ DESKTOP hero header (hidden on mobile) ═══ -->
      <div class="hidden md:block bg-dark px-8 pt-0 pb-[4.5rem] relative overflow-hidden">
        <div class="absolute rounded-full pointer-events-none w-[300px] h-[300px] top-[-45%] right-[-12%] bg-[radial-gradient(circle,rgba(201,146,13,.2)_0%,transparent_70%)]"></div>
        <div class="flex items-center gap-3 py-4 pb-6 relative z-10 justify-between">
          <a routerLink="/dashboard" class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white no-underline shrink-0 transition-colors hover:bg-white/[.18]" aria-label="Retour accueil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <app-lang-switcher />
        </div>
        <p class="text-[.8125rem] text-[rgba(210,190,140,.7)] relative z-10">{{ 'profile.title' | translate }}</p>
        <h1 class="text-white text-[1.375rem] font-bold tracking-[-0.01em] mt-[.15rem] mb-0 relative z-10">{{ auth.fullName() }}</h1>
      </div>

      <!-- ═══ DESKTOP identity card with overlap (hidden on mobile) ═══ -->
      <div class="hidden md:flex mx-8 -mt-12 bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(15,23,42,.1)] items-center gap-4 relative z-10 animate-entry">
        <div class="w-16 h-16 rounded-full shrink-0 bg-gradient-to-br from-primary to-primary-dk flex items-center justify-center text-white text-[1.375rem] font-bold shadow-[0_4px_16px_rgba(27,79,138,.3)]">{{ auth.initials() }}</div>
        <div>
          <p class="text-[1.0625rem] font-bold text-slate-900 m-0 mb-[.2rem]">{{ auth.fullName() }}</p>
          <span class="inline-block text-[.6875rem] font-bold uppercase tracking-[.07em] text-[#92680A] bg-gold-lt px-[.7rem] py-[.2rem] rounded-full border border-[rgba(201,146,13,.2)]">{{ auth.role() }}</span>
        </div>
        <a routerLink="/profile/edit" class="ml-auto shrink-0 px-4 py-2 rounded-[10px] bg-gradient-to-br from-primary to-primary-dk text-white text-[.8125rem] font-bold no-underline flex items-center gap-1.5 shadow-[0_2px_8px_rgba(27,79,138,.3)] transition-all hover:opacity-90 hover:-translate-y-px" [attr.aria-label]="'profile.edit' | translate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ 'profile.edit' | translate }}
        </a>
      </div>

      <!-- ═══ MOBILE identity card (hidden on md+) ═══ -->
      <div class="md:hidden mx-4 mt-4 bg-white rounded-[20px] p-5 shadow-[0_1px_4px_rgba(15,23,42,.08)] flex items-center gap-4 animate-entry">
        <div class="w-14 h-14 rounded-full shrink-0 bg-gradient-to-br from-primary to-primary-dk flex items-center justify-center text-white text-xl font-bold shadow-[0_4px_16px_rgba(27,79,138,.3)]">{{ auth.initials() }}</div>
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-slate-900 m-0 mb-1 truncate">{{ auth.fullName() }}</p>
          <span class="inline-block text-[.6875rem] font-bold uppercase tracking-[.07em] text-[#92680A] bg-gold-lt px-3 py-[.2rem] rounded-full border border-[rgba(201,146,13,.2)]">{{ auth.role() }}</span>
        </div>
        <a routerLink="/profile/edit" class="shrink-0 px-4 py-2 rounded-[10px] bg-gradient-to-br from-primary to-primary-dk text-white text-[.8125rem] font-bold no-underline flex items-center gap-1.5 shadow-[0_2px_8px_rgba(27,79,138,.3)] transition-all hover:opacity-90 hover:-translate-y-px" [attr.aria-label]="'profile.edit' | translate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ 'profile.edit' | translate }}
        </a>
      </div>

      <!-- ═══ Shared menu sections ═══ -->
      <div class="px-4 md:px-8 pt-5 pb-24 md:pb-8">

        <!-- Account section -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.account' | translate }}</p>
        <div class="bg-white rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)]">
          <a routerLink="/wallet" class="flex items-center gap-3.5 px-5 py-[.9375rem] no-underline border-b border-slate-50 transition-colors hover:bg-slate-50">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-primary-lt shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.wallet' | translate }}</p>
              <p class="text-xs text-slate-400 mt-[.1rem] m-0">{{ 'profile.walletSub' | translate }}</p>
            </div>
            <svg class="text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
          <a routerLink="/escrow" class="flex items-center gap-3.5 px-5 py-[.9375rem] no-underline transition-colors hover:bg-slate-50">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#F0FDF4] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.transactions' | translate }}</p>
              <p class="text-xs text-slate-400 mt-[.1rem] m-0">{{ 'profile.transactionsSub' | translate }}</p>
            </div>
            <svg class="text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        </div>

        <!-- Security section -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.security' | translate }}</p>
        <div class="bg-white rounded-[18px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)]">
          <a routerLink="/profile/security" class="flex items-center gap-3.5 px-5 py-[.9375rem] no-underline transition-colors hover:bg-slate-50">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#FFF7ED] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.securityTitle' | translate }}</p>
              <p class="text-xs text-slate-400 mt-[.1rem] m-0">{{ 'profile.securitySub' | translate }}</p>
            </div>
            <svg class="text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        </div>

        <!-- Logout -->
        <button (click)="auth.logout()"
                class="w-full mt-4 py-[.9375rem] rounded-[14px] bg-error-lt border-[1.5px] border-red-200 text-error text-[.9375rem] font-bold cursor-pointer flex items-center justify-center gap-2 font-[inherit] transition-colors hover:bg-red-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {{ 'profile.logout' | translate }}
        </button>

      </div>
    </div>
  `,
})
export class ProfileHomeComponent {
  protected readonly auth = inject(AuthStore);
}
