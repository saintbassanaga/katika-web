import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="min-h-[100svh] bg-dark flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div class="absolute rounded-full pointer-events-none w-[380px] h-[380px] top-[-20%] right-[-15%] bg-[radial-gradient(circle,rgba(201,146,13,.2)_0%,transparent_70%)] orb-1"></div>
      <div class="absolute rounded-full pointer-events-none w-[250px] h-[250px] bottom-[-10%] left-[-10%] bg-[radial-gradient(circle,rgba(27,79,138,.25)_0%,transparent_70%)] orb-2"></div>

      <div class="relative z-10 w-full max-w-[420px] bg-white rounded-[24px] px-8 pt-9 pb-10 shadow-[0_24px_80px_rgba(0,0,0,.35)] animate-entry">

        <!-- Brand -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-[42px] h-[42px] bg-gradient-to-br from-gold to-gold-dk rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(201,146,13,.35)] shrink-0">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 5v18M7 14l10-9M7 14l10 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-[1.125rem] font-extrabold text-dark tracking-[-0.02em]">Katika</span>
        </div>

        <!-- Step indicators -->
        <div class="flex gap-1.5 mb-7">
          <div class="h-1 rounded-full flex-1 transition-colors duration-300" [class]="step() >= 1 ? 'bg-primary' : 'bg-slate-200'"></div>
          <div class="h-1 rounded-full flex-1 transition-colors duration-300" [class]="step() >= 2 ? 'bg-success' : 'bg-slate-200'"></div>
        </div>

        <!-- ── STEP 1 : Email ─────────────────────── -->
        @if (step() === 1) {
          <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-1 tracking-[-0.02em]">{{ 'auth.forgotPassword.title' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7 leading-relaxed">{{ 'auth.forgotPassword.emailSub' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.emailLabel' | translate }}</label>
              <input type="email"
                     formControlName="email"
                     [placeholder]="'auth.forgotPassword.emailPh' | translate"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="form.get('email')?.invalid && form.get('email')?.touched" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.register.emailError' | translate }}</p>
              }
            </div>

            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] mt-6 font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'auth.forgotPassword.sendingLink' | translate }}
              } @else {
                {{ 'auth.forgotPassword.sendLink' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            </button>
          </form>

          <div class="flex items-center justify-center gap-1.5 mt-5 text-sm text-slate-500">
            <a routerLink="/auth/login" class="text-primary font-bold no-underline hover:underline">← {{ 'auth.forgotPassword.backToLogin' | translate }}</a>
          </div>
        }

        <!-- ── STEP 2 : Check inbox + resend ──────── -->
        @if (step() === 2) {
          <div class="text-center">
            <div class="w-16 h-16 rounded-[20px] mx-auto mb-6 bg-gradient-to-br from-primary to-primary-dk flex items-center justify-center shadow-[0_8px_24px_rgba(27,79,138,.3)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-2 tracking-[-0.02em]">{{ 'auth.forgotPassword.checkInboxTitle' | translate }}</p>
            <p class="text-sm text-slate-500 text-center leading-relaxed m-0 mb-6">{{ 'auth.forgotPassword.checkInboxSub' | translate }}</p>

            <!-- Resend section -->
            <div class="mb-6 p-4 rounded-[14px] bg-slate-50 border border-slate-100">
              @if (canResend()) {
                <button type="button"
                        class="w-full text-[.875rem] font-semibold text-primary bg-transparent border-none cursor-pointer py-1 transition-colors hover:text-primary-dk disabled:opacity-50"
                        [disabled]="loading()"
                        (click)="resend()">
                  @if (loading()) {
                    <span class="inline-flex items-center gap-2">
                      <span class="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                      {{ 'auth.forgotPassword.sendingLink' | translate }}
                    </span>
                  } @else {
                    {{ 'auth.forgotPassword.resend' | translate }}
                  }
                </button>
              } @else {
                <div class="flex items-center justify-center gap-2 text-[.8125rem] text-slate-400">
                  <span class="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin shrink-0"></span>
                  {{ 'auth.forgotPassword.resendIn' | translate: { count: resendCooldown() } }}
                </div>
              }
            </div>

            <a routerLink="/auth/login"
               class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold no-underline rounded-[14px] flex items-center justify-center gap-2 min-h-[52px] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90">
              {{ 'auth.forgotPassword.backToLogin' | translate }}
            </a>
          </div>
        }

      </div>
    </div>
  `,
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly svc = inject(AuthService);
  private readonly fb  = inject(FormBuilder);

  protected readonly step          = signal(1);
  protected readonly loading       = signal(false);
  protected readonly resendCooldown = signal(60);

  protected readonly canResend = computed(() => this.resendCooldown() <= 0);

  private cooldownTimer?: ReturnType<typeof setInterval>;

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.forgotPassword(this.form.value.email!));
      this.step.set(2);
      this.startResendCooldown();
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }

  protected async resend(): Promise<void> {
    if (!this.canResend() || this.loading()) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.forgotPassword(this.form.value.email!));
      this.resendCooldown.set(60);
      this.startResendCooldown();
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }

  private startResendCooldown(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      this.resendCooldown.set(next);
      if (next <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }
}
