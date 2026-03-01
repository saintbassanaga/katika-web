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
  template: `
    <div class="min-h-[100svh] flex flex-col bg-dark relative overflow-hidden md:flex-row">

      <!-- Orbs -->
      <div class="absolute rounded-full pointer-events-none w-[420px] h-[420px] top-[-18%] left-[-18%] bg-[radial-gradient(circle,rgba(27,79,138,.38)_0%,transparent_70%)] orb-1"></div>
      <div class="absolute rounded-full pointer-events-none w-[280px] h-[280px] bottom-[10%] right-[-12%] bg-[radial-gradient(circle,rgba(201,146,13,.28)_0%,transparent_70%)] orb-2"></div>
      <div class="absolute rounded-full pointer-events-none w-[200px] h-[200px] bottom-[40%] left-[5%] bg-[radial-gradient(circle,rgba(27,79,138,.15)_0%,transparent_70%)]"></div>

      <!-- LEFT: Brand panel -->
      <div class="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-14 pb-8 text-center animate-entry
                  md:px-16 md:py-12">
        <div class="w-[68px] h-[68px] bg-gradient-to-br from-gold to-[#96650A] rounded-[20px] flex items-center justify-center mb-5 shadow-[0_10px_40px_rgba(201,146,13,.45)]">
          <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="text-white text-[2.5rem] font-extrabold tracking-[-0.04em] m-0 mb-2 md:text-5xl">Katika</h1>
        <p class="text-[#F5D48A] text-[.9rem] font-medium m-0 tracking-[.01em] md:text-[.9375rem]">{{ 'auth.login.tagline' | translate }}</p>

        <!-- Desktop-only feature list -->
        <ul class="hidden md:flex md:flex-col gap-3.5 mt-10 list-none p-0 self-start text-left">
          <li class="flex items-center gap-3 text-slate-200/75 text-sm font-medium">
            <div class="w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(27,79,138,.25)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            {{ 'auth.login.features.escrow' | translate }}
          </li>
          <li class="flex items-center gap-3 text-slate-200/75 text-sm font-medium">
            <div class="w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(16,185,129,.2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            {{ 'auth.login.features.protection' | translate }}
          </li>
          <li class="flex items-center gap-3 text-slate-200/75 text-sm font-medium">
            <div class="w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(245,158,11,.18)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            {{ 'auth.login.features.disputes' | translate }}
          </li>
          <li class="flex items-center gap-3 text-slate-200/75 text-sm font-medium">
            <div class="w-8 h-8 shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(139,92,246,.18)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            {{ 'auth.login.features.payout' | translate }}
          </li>
        </ul>
      </div>

      <!-- RIGHT: Form panel -->
      <div class="relative z-10 bg-white rounded-t-[2rem] px-6 pt-9 pb-12 animate-card
                  md:flex-1 md:rounded-none md:flex md:flex-col md:items-center md:justify-center md:px-16 md:py-12 md:min-h-[100svh] md:shadow-[-32px_0_80px_rgba(0,0,0,.15)]">
        <div class="w-full md:max-w-[380px]">
          <p class="text-[1.5rem] font-bold text-dark m-0 mb-1 tracking-[-0.02em]">{{ 'auth.login.title' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7">{{ 'auth.login.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-[1.125rem]">

            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.45rem] tracking-[.01em]">{{ 'auth.login.phone' | translate }}</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.login.phoneError' | translate }}</p>
              }
            </div>

            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.45rem] tracking-[.01em]">{{ 'auth.login.password' | translate }}</label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-[.8125rem] pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                  [class.border-error]="form.get('password')?.invalid && form.get('password')?.touched"
                />
                <button type="button"
                        (click)="showPassword.set(!showPassword())"
                        class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600"
                        [attr.aria-label]="showPassword() ? 'Masquer' : 'Afficher'">
                  @if (showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.login.passwordError' | translate }}</p>
              }
            </div>

            <div class="text-right">
              <a routerLink="/auth/forgot-password" class="text-[.8125rem] font-semibold text-primary no-underline hover:underline">{{ 'auth.login.forgotPassword' | translate }}</a>
            </div>

            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.38)] transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="form.invalid || auth.loading()">
              @if (auth.loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'auth.login.submitting' | translate }}
              } @else {
                {{ 'auth.login.submit' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-6">
            {{ 'auth.login.noAccount' | translate }}
            <a routerLink="/auth/register" class="text-primary font-bold no-underline hover:underline">{{ 'auth.login.signUp' | translate }}</a>
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
      phoneNumber: this.form.value.phoneNumber!,
      password:    this.form.value.password!,
    });
  }
}
