import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher/lang-switcher.component';

interface MenuItem { icon: string; label: string; sub?: string; route: string; danger?: boolean; }

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LangSwitcherComponent],
  styles: [`
    .page { min-height: 100svh; background: #EDF1F7; }

    /* Header */
    .header { background: #0F2240; padding: 0 1.25rem 4.5rem; position: relative; overflow: hidden; }
    .header-orb {
      position: absolute; border-radius: 50%; pointer-events: none;
      width: 300px; height: 300px; top: -45%; right: -12%;
      background: radial-gradient(circle, rgba(201,146,13,.2) 0%, transparent 70%);
    }
    .header-nav {
      display: flex; align-items: center; gap: .75rem;
      padding: 1rem 0 1.5rem; position: relative; z-index: 1;
    }
    .back-btn {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: rgba(255,255,255,.1); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; text-decoration: none; transition: background .2s;
    }
    .back-btn:hover { background: rgba(255,255,255,.18); }
    .header-title { color: rgba(210,190,140,.7); font-size: .8125rem; font-weight: 400; position: relative; z-index: 1; }
    .header-name  { color: #fff; font-size: 1.375rem; font-weight: 700; letter-spacing: -.01em; margin: .15rem 0 0; position: relative; z-index: 1; }

    /* Identity card */
    .identity-card {
      margin: -3rem 1rem 0;
      background: #fff; border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(15,23,42,.1);
      display: flex; align-items: center; gap: 1rem;
      position: relative; z-index: 10;
    }
    .avatar-circle {
      width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.375rem; font-weight: 700;
      box-shadow: 0 4px 16px rgba(27,79,138,.3);
    }
    .identity-name { font-size: 1.0625rem; font-weight: 700; color: #0F172A; margin: 0 0 .2rem; }
    .identity-role {
      display: inline-block; font-size: .6875rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .07em;
      color: #92680A; background: #FDF4DC;
      padding: .2rem .7rem; border-radius: 99px;
      border: 1px solid rgba(201,146,13,.2);
    }
    .edit-btn {
      margin-left: auto; flex-shrink: 0;
      padding: .5rem 1rem; border-radius: 10px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .8125rem; font-weight: 700;
      text-decoration: none; display: flex; align-items: center; gap: .375rem;
      box-shadow: 0 2px 8px rgba(27,79,138,.3);
      transition: opacity .2s, transform .15s;
    }
    .edit-btn:hover { opacity: .9; transform: translateY(-1px); }

    /* Content */
    .content { padding: 1.25rem 1rem 6rem; }

    /* Menu group */
    .menu-group-title { font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94A3B8; margin: 1.25rem 0 .5rem .25rem; }
    .menu-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 1px 4px rgba(15,23,42,.06); }
    .menu-item {
      display: flex; align-items: center; gap: .875rem;
      padding: .9375rem 1.25rem; text-decoration: none;
      border-bottom: 1px solid #F8FAFC;
      transition: background .15s;
    }
    .menu-item:last-child { border-bottom: none; }
    .menu-item:hover { background: #F8FAFC; }
    .menu-item.danger:hover { background: #FEF2F2; }
    .item-icon {
      width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1rem;
    }
    .item-text { flex: 1; }
    .item-label { font-size: .875rem; font-weight: 600; color: #0F172A; }
    .item-sub   { font-size: .75rem; color: #94A3B8; margin-top: .1rem; }
    .menu-item.danger .item-label { color: #DC2626; }
    .chevron { color: #CBD5E1; }

    /* Logout button */
    .logout-btn {
      width: 100%; margin-top: 1rem;
      padding: .9375rem; border-radius: 14px;
      background: #FEF2F2; border: 1.5px solid #FECACA;
      color: #DC2626; font-size: .9375rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: .5rem;
      font-family: inherit; transition: background .2s;
    }
    .logout-btn:hover { background: #FEE2E2; }
  `],
  template: `
    <div class="page animate-fade">

      <!-- Header -->
      <div class="header">
        <div class="header-orb"></div>
        <div class="header-nav" style="justify-content:space-between">
          <a routerLink="/dashboard" class="back-btn" aria-label="Retour accueil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <app-lang-switcher />
        </div>
        <p class="header-title">{{ 'profile.title' | translate }}</p>
        <h1 class="header-name">{{ auth.fullName() }}</h1>
      </div>

      <!-- Identity card -->
      <div class="identity-card animate-entry">
        <div class="avatar-circle">{{ auth.initials() }}</div>
        <div>
          <p class="identity-name">{{ auth.fullName() }}</p>
          <span class="identity-role">{{ auth.role() }}</span>
        </div>
        <a routerLink="/profile/edit" class="edit-btn" [attr.aria-label]="'profile.edit' | translate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          {{ 'profile.edit' | translate }}
        </a>
      </div>

      <div class="content">

        <!-- Account section -->
        <p class="menu-group-title">{{ 'profile.account' | translate }}</p>
        <div class="menu-card">
          <a routerLink="/wallet" class="menu-item">
            <div class="item-icon" style="background:#E5EEF8">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="item-text">
              <p class="item-label">{{ 'profile.wallet' | translate }}</p>
              <p class="item-sub">{{ 'profile.walletSub' | translate }}</p>
            </div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
          <a routerLink="/escrow" class="menu-item">
            <div class="item-icon" style="background:#F0FDF4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
              </svg>
            </div>
            <div class="item-text">
              <p class="item-label">{{ 'profile.transactions' | translate }}</p>
              <p class="item-sub">{{ 'profile.transactionsSub' | translate }}</p>
            </div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        </div>

        <!-- Security section -->
        <p class="menu-group-title">{{ 'profile.security' | translate }}</p>
        <div class="menu-card">
          <a routerLink="/profile/security" class="menu-item">
            <div class="item-icon" style="background:#FFF7ED">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="item-text">
              <p class="item-label">{{ 'profile.securityTitle' | translate }}</p>
              <p class="item-sub">{{ 'profile.securitySub' | translate }}</p>
            </div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        </div>

        <!-- Logout -->
        <button (click)="auth.logout()" class="logout-btn">
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
