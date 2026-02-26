import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notification/toast.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '@ngx-translate/core';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('newPassword')?.value === c.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent, TranslatePipe],
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

        <!-- Step dots -->
        <div class="flex gap-1.5 mb-7">
          <div class="h-1 rounded-full flex-1 transition-colors duration-300" [class]="step() > 1 ? 'bg-success' : step() === 1 ? 'bg-primary' : 'bg-slate-200'"></div>
          <div class="h-1 rounded-full flex-1 transition-colors duration-300" [class]="step() > 2 ? 'bg-success' : step() === 2 ? 'bg-primary' : 'bg-slate-200'"></div>
          <div class="h-1 rounded-full flex-1 transition-colors duration-300" [class]="step() > 3 ? 'bg-success' : step() === 3 ? 'bg-primary' : 'bg-slate-200'"></div>
        </div>

        <!-- ── STEP 1 : Phone ─────────────────────── -->
        @if (step() === 1) {
          <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-1 tracking-[-0.02em]">{{ 'auth.forgotPassword.title' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7 leading-relaxed">{{ 'auth.forgotPassword.phoneSub' | translate }}</p>

          <form [formGroup]="phoneForm" (ngSubmit)="sendCode()">
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.phoneLabel' | translate }}</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (phoneForm.get('phoneNumber')?.invalid && phoneForm.get('phoneNumber')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.login.phoneError' | translate }}</p>
              }
            </div>

            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] mt-6 font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="phoneForm.invalid || loading()">
              @if (loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'auth.forgotPassword.sending' | translate }}
              } @else {
                {{ 'auth.forgotPassword.sendCode' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              }
            </button>
          </form>
        }

        <!-- ── STEP 2 : OTP ───────────────────────── -->
        @if (step() === 2) {
          <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-1 tracking-[-0.02em]">{{ 'auth.forgotPassword.codeLabel' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7 leading-relaxed">
            {{ 'auth.forgotPassword.codeSub' | translate }}
            <span class="inline-block bg-primary-lt text-primary font-bold rounded-lg px-2.5 py-1 text-sm">+237 {{ phoneForm.value.phoneNumber }}</span>
          </p>

          <div class="flex gap-2">
            @for (i of [0,1,2,3,4,5]; track i) {
              <input #otpCell type="text" inputmode="numeric" maxlength="1"
                     class="otp-cell flex-1 h-14 text-center border-2 border-slate-200 rounded-xl bg-slate-50 text-[1.375rem] font-bold text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     (input)="onOtpInput($event, i)"
                     (keydown)="onOtpKeydown($event, i)" />
            }
          </div>

          <button class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] mt-6 font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                  [disabled]="otpCode().length < 6 || loading()"
                  (click)="verifyCode()">
            @if (loading()) {
              <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
              {{ 'auth.forgotPassword.verifying' | translate }}
            } @else {
              {{ 'auth.forgotPassword.verify' | translate }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            }
          </button>

          <div class="flex items-center justify-center gap-1.5 mt-[.875rem] text-sm text-slate-500">
            <a href="#" class="text-primary font-bold no-underline hover:underline" (click)="resendCode($event)">{{ 'auth.forgotPassword.sendCode' | translate }}</a>
          </div>
        }

        <!-- ── STEP 3 : New password ─────────────── -->
        @if (step() === 3) {
          <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-1 tracking-[-0.02em]">{{ 'auth.forgotPassword.newPassword' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7 leading-relaxed">{{ 'auth.register.passwordPh' | translate }}</p>

          <form [formGroup]="resetForm" (ngSubmit)="submitReset()">

            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.newPassword' | translate }}</label>
              <div class="relative">
                <input [type]="showPwd() ? 'text' : 'password'"
                       formControlName="newPassword"
                       [placeholder]="'auth.register.passwordPh' | translate"
                       class="w-full px-4 py-[.8125rem] pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                       [class.border-error]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched" />
                <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600" (click)="showPwd.set(!showPwd())">
                  @if (showPwd()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                </button>
              </div>
              @if (resetForm.get('newPassword')?.errors?.['minlength'] && resetForm.get('newPassword')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordMin' | translate }}</p>
              }
              @if (resetForm.get('newPassword')?.errors?.['pattern'] && resetForm.get('newPassword')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordStrong' | translate }}</p>
              }
            </div>

            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.confirmPassword' | translate }}</label>
              <input [type]="showPwd() ? 'text' : 'password'"
                     formControlName="confirmPassword"
                     placeholder="••••••••"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" />
              @if (resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.register.mismatchError' | translate }}</p>
              }
            </div>

            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] mt-6 font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="resetForm.invalid || loading()">
              @if (loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'auth.forgotPassword.changing' | translate }}
              } @else {
                {{ 'auth.forgotPassword.changePassword' | translate }}
              }
            </button>
          </form>
        }

        <!-- ── STEP 4 : Success ──────────────────── -->
        @if (step() === 4) {
          <div class="text-center">
            <div class="w-16 h-16 rounded-[20px] mx-auto mb-6 bg-gradient-to-br from-success to-[#047857] flex items-center justify-center shadow-[0_8px_24px_rgba(5,150,105,.3)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-2 tracking-[-0.02em]">{{ 'auth.forgotPassword.successTitle' | translate }}</p>
            <p class="text-sm text-slate-500 text-center leading-relaxed m-0 mb-8">{{ 'auth.forgotPassword.successSub' | translate }}</p>
            <a routerLink="/auth/login"
               class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold no-underline rounded-[14px] flex items-center justify-center gap-2 min-h-[52px] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90">
              {{ 'auth.login.submit' | translate }}
            </a>
          </div>
        }

        @if (step() < 4) {
          <div class="flex items-center justify-center gap-1.5 mt-5 text-sm text-slate-500">
            <a routerLink="/auth/login" class="text-primary font-bold no-underline hover:underline">← {{ 'auth.forgotPassword.backToLogin' | translate }}</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly svc   = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb    = inject(FormBuilder);

  protected readonly step     = signal(1);
  protected readonly loading  = signal(false);
  protected readonly otpCode  = signal('');
  protected readonly showPwd  = signal(false);

  protected readonly phoneForm = this.fb.group({
    phoneNumber: ['', Validators.required],
  });

  protected readonly resetForm = this.fb.group({
    newPassword:     ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  /* ── Step 1 → send code ─────────────── */
  protected async sendCode(): Promise<void> {
    if (this.phoneForm.invalid) { this.phoneForm.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.forgotPassword(this.phoneForm.value.phoneNumber!));
      this.step.set(2);
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }

  protected async resendCode(e: Event): Promise<void> {
    e.preventDefault();
    if (this.loading()) return;
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.forgotPassword(this.phoneForm.value.phoneNumber!));
      this.toast.success('Code renvoyé avec succès.');
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }

  /* ── OTP input handlers ─────────────── */
  protected onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;
    const cells = document.querySelectorAll<HTMLInputElement>('.otp-cell');
    if (val && index < 5) cells[index + 1]?.focus();
    this.otpCode.set(Array.from(cells).map(c => c.value).join(''));
  }

  protected onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const cells = document.querySelectorAll<HTMLInputElement>('.otp-cell');
      if (!(event.target as HTMLInputElement).value && index > 0) {
        cells[index - 1].value = '';
        cells[index - 1].focus();
      }
      this.otpCode.set(Array.from(cells).map(c => c.value).join(''));
    }
  }

  /* ── Step 2 → verify OTP (client-side gate only) ── */
  protected verifyCode(): void {
    if (this.otpCode().length < 6) return;
    this.step.set(3);
  }

  /* ── Step 3 → reset password ────────── */
  protected async submitReset(): Promise<void> {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.resetPassword({
        phoneNumber: this.phoneForm.value.phoneNumber!,
        code:        this.otpCode(),
        newPassword: this.resetForm.value.newPassword!,
      }));
      this.step.set(4);
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }
}
