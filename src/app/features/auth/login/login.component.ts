import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent, TranslatePipe],
  styles: [`
    :host { display: block; }

    .auth-root {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      background: #0F2240;
    }

    /* ── BRAND PANEL ──────────────────────────────── */
    .brand {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem 2.5rem;
      z-index: 1;
    }

    /* Subtle grid texture */
    .brand::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(201,146,13,.065) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201,146,13,.065) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    .brand-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }

    .brand-orb-1 {
      width: 420px; height: 420px;
      top: -130px; left: -130px;
      background: radial-gradient(circle, rgba(27,79,138,.4) 0%, transparent 65%);
      animation: orbFloat1 9s ease-in-out infinite;
    }

    .brand-orb-2 {
      width: 300px; height: 300px;
      bottom: -80px; right: -60px;
      background: radial-gradient(circle, rgba(201,146,13,.2) 0%, transparent 65%);
      animation: orbFloat2 12s ease-in-out infinite;
    }

    /* Concentric circles — desktop only */
    .brand-circles {
      display: none;
      position: absolute;
      right: -70px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .brand-circle {
      position: absolute;
      border-radius: 50%;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }

    .bc1 { width: 100px; height: 100px; border: 1px solid rgba(201,146,13,.14); }
    .bc2 { width: 190px; height: 190px; border: 1px solid rgba(201,146,13,.09); }
    .bc3 { width: 280px; height: 280px; border: 1px solid rgba(201,146,13,.055); }
    .bc4 { width: 370px; height: 370px; border: 1px solid rgba(201,146,13,.03); }

    .brand-content { position: relative; z-index: 2; }

    .brand-logo {
      width: 56px; height: 56px;
      object-fit: contain;
      filter: drop-shadow(0 4px 20px rgba(0,0,0,.4));
    }

    .brand-name {
      font-family: 'Cormorant Garamond', 'Times New Roman', serif;
      font-size: 3.25rem;
      font-weight: 700;
      color: #fff;
      margin: 0.5rem 0 0;
      letter-spacing: 0.01em;
      line-height: 1;
    }

    .brand-sep {
      display: block;
      width: 40px; height: 2px;
      background: linear-gradient(90deg, transparent, #C9920D, transparent);
      margin: 0.625rem auto 0.5rem;
      border-radius: 1px;
    }

    .brand-tagline {
      color: #F5D48A;
      font-size: 0.8125rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      margin: 0;
    }

    .brand-features {
      display: none;
      list-style: none;
      padding: 0; margin: 2.5rem 0 0;
      flex-direction: column;
      gap: 0.375rem;
      text-align: left;
    }

    .bf-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      color: rgba(241,245,249,.72);
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.375rem 0;
    }

    .bf-icon {
      width: 32px; height: 32px;
      border-radius: 10px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── GOLDEN SPLIT DIVIDER ─────────────────────── */
    .split-divider {
      display: none;
      width: 2px;
      flex-shrink: 0;
      background: linear-gradient(to bottom,
        transparent 0%,
        #C9920D 22%,
        #F5D48A 50%,
        #C9920D 78%,
        transparent 100%);
      position: relative;
      align-self: stretch;
    }

    .split-divider::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      width: 9px; height: 9px;
      background: #F5D48A;
      box-shadow:
        0 0 0 3px rgba(201,146,13,.3),
        0 0 0 7px rgba(201,146,13,.15),
        0 0 24px rgba(201,146,13,.5);
    }

    /* ── FORM PANEL ───────────────────────────────── */
    .form-side {
      background: #FEFDFB;
      border-radius: 2rem 2rem 0 0;
      padding: 2.25rem 1.5rem 3.5rem;
      flex: 1;
    }

    .form-inner { width: 100%; }

    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F2240;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }

    .form-sub {
      font-size: 0.875rem;
      color: #64748B;
      margin: 0 0 1.75rem;
    }

    .field-wrap { display: flex; flex-direction: column; }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
      letter-spacing: 0.01em;
    }

    .field-input {
      width: 100%;
      padding: 0.8125rem 1rem;
      border: 2px solid #E2E8F0;
      border-radius: 0.75rem;
      background: #F8F9FC;
      font-size: 0.9375rem;
      color: #0F172A;
      outline: none;
      font-family: inherit;
      transition: border-color .15s, background .15s, box-shadow .15s;
    }

    .field-input:focus {
      border-color: #1B4F8A;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }

    .field-input.is-error { border-color: #DC2626; }

    .field-error { font-size: 0.75rem; color: #DC2626; margin: 0.375rem 0 0; }

    .pw-wrap { position: relative; }

    .pw-toggle {
      position: absolute;
      right: 0.875rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      cursor: pointer; color: #94A3B8;
      padding: 0.25rem;
      display: flex; align-items: center;
      transition: color .15s;
    }

    .pw-toggle:hover { color: #64748B; }

    .forgot-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1B4F8A;
      text-decoration: none;
      align-self: flex-end;
    }

    .forgot-link:hover { text-decoration: underline; }

    .submit-btn {
      width: 100%;
      padding: 0.9375rem;
      background: linear-gradient(135deg, #1B4F8A 0%, #0D3D6E 100%);
      color: #fff;
      font-size: 0.9375rem;
      font-weight: 700;
      border: none;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 52px;
      font-family: inherit;
      box-shadow: 0 4px 20px rgba(27,79,138,.38);
      transition: opacity .15s, transform .15s;
    }

    .submit-btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
    .submit-btn:active:not(:disabled) { transform: none; }
    .submit-btn:disabled { opacity: .55; cursor: not-allowed; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .footer-note { text-align: center; font-size: .875rem; color: #64748B; margin-top: 1.5rem; }
    .footer-note a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .footer-note a:hover { text-decoration: underline; }

    /* ── DESKTOP ──────────────────────────────────── */
    @media (min-width: 768px) {
      .auth-root { flex-direction: row; overflow: hidden; min-height: 100svh; }

      .brand {
        flex: 0 0 44%;
        align-items: flex-start;
        text-align: left;
        padding: 0 3.5rem;
        min-height: 100svh;
        justify-content: center;
      }

      .brand-sep { margin: 0.625rem 0 0.5rem; }
      .brand-name { font-size: 4.5rem; }
      .brand-features { display: flex; }
      .brand-circles { display: block; }
      .split-divider { display: block; }

      .form-side {
        flex: 1;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100svh;
        padding: 3rem;
        box-shadow: -32px 0 80px rgba(0,0,0,.12);
        overflow-y: auto;
      }

      .form-inner { max-width: 380px; width: 100%; }
    }
  `],
  template: `
    <div class="auth-root animate-fade">

      <!-- BRAND PANEL -->
      <div class="brand">
        <div class="brand-orb brand-orb-1"></div>
        <div class="brand-orb brand-orb-2"></div>
        <div class="brand-circles">
          <div class="brand-circle bc1"></div>
          <div class="brand-circle bc2"></div>
          <div class="brand-circle bc3"></div>
          <div class="brand-circle bc4"></div>
        </div>

        <div class="brand-content">
          <img src="/icons/icon-512-transparent.png" alt="Katica" class="brand-logo" />
          <h1 class="brand-name">Katica</h1>
          <span class="brand-sep"></span>
          <p class="brand-tagline">{{ 'auth.login.tagline' | translate }}</p>

          <ul class="brand-features">
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(27,79,138,.25)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              {{ 'auth.login.features.escrow' | translate }}
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(16,185,129,.2)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              {{ 'auth.login.features.protection' | translate }}
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(245,158,11,.18)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              {{ 'auth.login.features.disputes' | translate }}
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(139,92,246,.18)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              {{ 'auth.login.features.payout' | translate }}
            </li>
          </ul>
        </div>
      </div>

      <!-- GOLDEN DIVIDER (desktop only) -->
      <div class="split-divider"></div>

      <!-- FORM PANEL -->
      <div class="form-side animate-card">
        <div class="form-inner">
          <p class="form-title">{{ 'auth.login.title' | translate }}</p>
          <p class="form-sub">{{ 'auth.login.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display:flex;flex-direction:column;gap:1.125rem">

            <div class="field-wrap">
              <label class="field-label">{{ 'auth.login.phone' | translate }}</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                <p class="field-error">{{ 'auth.login.phoneError' | translate }}</p>
              }
            </div>

            <div class="field-wrap">
              <label class="field-label">{{ 'auth.login.password' | translate }}</label>
              <div class="pw-wrap">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="field-input"
                  [class.is-error]="form.get('password')?.invalid && form.get('password')?.touched"
                />
                <button type="button" class="pw-toggle"
                        (click)="showPassword.set(!showPassword())"
                        [attr.aria-label]="showPassword() ? 'Masquer' : 'Afficher'">
                  @if (showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="field-error">{{ 'auth.login.passwordError' | translate }}</p>
              }
            </div>

            <a routerLink="/auth/forgot-password" class="forgot-link">{{ 'auth.login.forgotPassword' | translate }}</a>

            <button type="submit" class="submit-btn" [disabled]="form.invalid || auth.loading()">
              @if (auth.loading()) {
                <span class="spinner"></span>
                {{ 'auth.login.submitting' | translate }}
              } @else {
                {{ 'auth.login.submit' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            </button>
          </form>

          <p class="footer-note">
            {{ 'auth.login.noAccount' | translate }}
            <a routerLink="/auth/register">{{ 'auth.login.signUp' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly showPassword = signal(false);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    phoneNumber: ['', Validators.required],
    password:    ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.auth.login({
      phoneNumber: this.form.value.phoneNumber!,  // already +{dialCode}{digits}
      password:    this.form.value.password!,
    });
  }
}
