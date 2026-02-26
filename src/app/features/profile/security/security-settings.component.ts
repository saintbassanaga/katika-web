import {Component, inject, signal} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notification/toast.service';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('newPassword')?.value === c.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe],
  template: `
    <div class="min-h-[100svh] bg-page animate-fade">

      <!-- Topbar -->
      <div class="bg-dark px-5 py-4 flex items-center gap-3.5">
        <a routerLink="/profile" class="w-9 h-9 rounded-[10px] bg-white/10 border-none cursor-pointer flex items-center justify-center text-white no-underline shrink-0 transition-colors hover:bg-white/[.18]" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <span class="text-white text-base font-bold tracking-[-0.01em]">{{ 'profile.securityForm.topbarTitle' | translate }}</span>
      </div>

      <div class="px-5 py-5 max-w-[560px] mx-auto animate-entry">

        <!-- ── Verification ─────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mb-2 ml-0.5">{{ 'profile.securityForm.verificationSection' | translate }}</p>

        @if (auth.isVerified()) {
          <div class="bg-gradient-to-br from-success to-[#047857] rounded-[20px] px-6 py-4 flex items-center gap-3.5 mb-3">
            <div class="w-10 h-10 rounded-xl shrink-0 bg-white/[.18] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <p class="text-white text-sm font-semibold m-0">{{ 'profile.securityForm.verified' | translate }}</p>
              <p class="text-white/70 text-xs m-0 mt-[.1rem]">{{ 'profile.securityForm.verifiedSub' | translate }}</p>
            </div>
          </div>
        } @else {
          <div class="bg-gradient-to-br from-primary to-primary-dk rounded-[20px] px-6 py-5 flex items-center gap-4 mb-3 relative overflow-hidden">
            <div class="absolute top-[-40%] right-[-10%] w-[200px] h-[200px] rounded-full bg-white/[.07] pointer-events-none"></div>
            <div class="w-12 h-12 rounded-[14px] shrink-0 bg-white/[.15] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-white text-[.9375rem] font-bold m-0 mb-[.2rem]">{{ 'profile.securityForm.notVerified' | translate }}</p>
              <p class="text-white/70 text-[.8125rem] m-0">{{ 'profile.securityForm.notVerifiedSub' | translate }}</p>
            </div>
            <button class="ml-auto shrink-0 px-4 py-2 rounded-[10px] bg-white/20 text-white text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] whitespace-nowrap transition-colors hover:bg-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    (click)="requestVerification()" [disabled]="verifyLoading()">
              @if (verifyLoading()) { {{ 'profile.securityForm.sending' | translate }} } @else { {{ 'profile.securityForm.verifyBtn' | translate }} }
            </button>
          </div>
        }

        <!-- ── Password ─────────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.securityForm.passwordSection' | translate }}</p>
        <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-3">
          <div class="flex items-center gap-3.5 px-5 py-4">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#FFF7ED] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.securityForm.passwordLabel' | translate }}</p>
              <p class="text-xs text-slate-400 mt-[.1rem] m-0">{{ 'profile.securityForm.lastChanged' | translate }}</p>
            </div>
            <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary-lt text-primary text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-[#C8DCF2]"
                    (click)="togglePwdForm()">
              {{ showPwdForm() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.modify' | translate) }}
            </button>
          </div>

          @if (showPwdForm()) {
            <div class="px-5 pb-5 border-t border-page animate-slide-down">
              <form [formGroup]="pwdForm" (ngSubmit)="changePassword()">

                <div class="mb-4 mt-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.currentPassword' | translate }}</label>
                  <div class="relative">
                    <input [type]="showCurrent() ? 'text' : 'password'" formControlName="currentPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                           [class.border-error]="isInvalidPwd('currentPassword')" />
                    <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600" (click)="showCurrent.set(!showCurrent())">
                      @if (showCurrent()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (isInvalidPwd('currentPassword')) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.currentPasswordRequired' | translate }}</p>
                  }
                </div>

                <div class="mb-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.newPassword' | translate }}</label>
                  <div class="relative">
                    <input [type]="showNew() ? 'text' : 'password'" formControlName="newPassword"
                           [placeholder]="'profile.securityForm.passwordPh' | translate"
                           class="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                           [class.border-error]="isInvalidPwd('newPassword')" />
                    <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600" (click)="showNew.set(!showNew())">
                      @if (showNew()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (pwdForm.get('newPassword')?.errors?.['minlength'] && pwdForm.get('newPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordMin' | translate }}</p>
                  }
                  @if (pwdForm.get('newPassword')?.errors?.['pattern'] && pwdForm.get('newPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordStrong' | translate }}</p>
                  }
                </div>

                <div class="mb-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.confirmPassword' | translate }}</label>
                  <input [type]="showNew() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••"
                         class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                         [class.border-error]="pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched" />
                  @if (pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordMismatch' | translate }}</p>
                  }
                </div>

                <div class="flex gap-2.5 mt-[1.125rem]">
                  <button type="button" class="px-[1.125rem] py-3 rounded-xl bg-page text-slate-500 text-sm font-semibold border-none cursor-pointer font-[inherit] transition-colors hover:bg-slate-200"
                          (click)="togglePwdForm()">{{ 'profile.securityForm.cancel' | translate }}</button>
                  <button type="submit"
                          class="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dk text-white text-sm font-bold border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(27,79,138,.3)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          [disabled]="pwdForm.invalid || pwdLoading()">
                    @if (pwdLoading()) {
                      <span class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                      {{ 'profile.securityForm.changing' | translate }}
                    } @else {
                      {{ 'profile.securityForm.changePassword' | translate }}
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>

        <!-- ── 2FA ──────────────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.securityForm.mfaSection' | translate }}</p>
        <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-3">
          <div class="flex items-center gap-3.5 px-5 py-4">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#F0FDF4] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.securityForm.mfaLabel' | translate }}</p>
              <p class="text-xs mt-[.1rem] m-0" [style.color]="auth.hasMfa() ? '#16A34A' : '#94A3B8'">
                {{ auth.hasMfa() ? ('profile.securityForm.mfaEnabled' | translate) : ('profile.securityForm.mfaDisabled' | translate) }}
              </p>
            </div>
            @if (auth.hasMfa()) {
              <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-error-lt text-error text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-red-100"
                      (click)="toggleMfaDisable()">
                {{ showMfaDisable() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.disable' | translate) }}
              </button>
            } @else {
              <a routerLink="/profile/security/mfa" class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary-lt text-primary text-[.8125rem] font-bold no-underline transition-colors hover:bg-[#C8DCF2]">{{ 'profile.securityForm.enable' | translate }}</a>
            }
          </div>

          @if (showMfaDisable()) {
            <div class="px-5 pb-5 border-t border-page animate-slide-down">
              <p class="text-[.8125rem] text-slate-500 m-0 mt-4 mb-3.5">{{ 'profile.securityForm.disablePrompt' | translate }}</p>
              <div class="flex gap-2">
                @for (i of [0,1,2,3,4,5]; track i) {
                  <input #mfaCell type="text" inputmode="numeric" maxlength="1"
                         class="otp-cell w-11 h-[52px] text-center border-2 border-slate-200 rounded-xl bg-slate-50 text-[1.25rem] font-bold text-slate-900 outline-none font-[inherit] transition-all focus:border-error focus:shadow-[0_0_0_4px_rgba(220,38,38,.08)]"
                         (input)="onMfaCellInput($event, i)"
                         (keydown)="onMfaCellKeydown($event, i)" />
                }
              </div>
              <div class="flex gap-2.5 mt-3.5">
                <button type="button" class="px-[1.125rem] py-3 rounded-xl bg-page text-slate-500 text-sm font-semibold border-none cursor-pointer font-[inherit] transition-colors hover:bg-slate-200"
                        (click)="toggleMfaDisable()">{{ 'profile.securityForm.cancel' | translate }}</button>
                <button type="button"
                        class="flex-1 py-3 rounded-xl bg-gradient-to-br from-error to-[#B91C1C] text-white text-sm font-bold border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(220,38,38,.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="mfaCode().length < 6 || mfaLoading()"
                        (click)="disableMfa()">
                  @if (mfaLoading()) {
                    <span class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                    {{ 'profile.securityForm.disabling' | translate }}
                  } @else {
                    {{ 'profile.securityForm.confirmDisable' | translate }}
                  }
                </button>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class SecuritySettingsComponent {
  protected readonly auth       = inject(AuthStore);
  private  readonly authService = inject(AuthService);
  private  readonly toast       = inject(ToastService);
  private  readonly fb          = inject(FormBuilder);

  /* ── UI state ── */
  protected readonly showPwdForm    = signal(false);
  protected readonly showMfaDisable = signal(false);
  protected readonly showCurrent    = signal(false);
  protected readonly showNew        = signal(false);
  protected readonly pwdLoading     = signal(false);
  protected readonly mfaLoading     = signal(false);
  protected readonly verifyLoading  = signal(false);
  protected readonly mfaCode        = signal('');

  /* ── Password form ── */
  protected readonly pwdForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  protected isInvalidPwd(f: string): boolean {
    const c = this.pwdForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  protected togglePwdForm(): void {
    this.showPwdForm.update(v => !v);
    if (!this.showPwdForm()) this.pwdForm.reset();
  }

  protected async changePassword(): Promise<void> {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    this.pwdLoading.set(true);
    try {
      await firstValueFrom(this.authService.changePassword({
        currentPassword: this.pwdForm.value.currentPassword!,
        newPassword:     this.pwdForm.value.newPassword!,
        confirmPassword:     this.pwdForm.value.confirmPassword!,
      }));
      this.toast.success('Mot de passe modifié avec succès.');
      this.togglePwdForm();
    } finally {
      this.pwdLoading.set(false);
    }
  }

  /* ── MFA disable ── */
  protected toggleMfaDisable(): void {
    this.showMfaDisable.update(v => !v);
    this.mfaCode.set('');
  }

  protected onMfaCellInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;

    const cells = document.querySelectorAll<HTMLInputElement>('.otp-cell');
    if (val && index < 5) cells[index + 1]?.focus();

    const code = Array.from(cells).map(c => c.value).join('');
    this.mfaCode.set(code);
  }

  protected onMfaCellKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const cells = document.querySelectorAll<HTMLInputElement>('.otp-cell');
      if (!(event.target as HTMLInputElement).value && index > 0) {
        cells[index - 1].value = '';
        cells[index - 1].focus();
      }
      const code = Array.from(cells).map(c => c.value).join('');
      this.mfaCode.set(code);
    }
  }

  protected async disableMfa(): Promise<void> {
    this.mfaLoading.set(true);
    try {
      await firstValueFrom(this.authService.disableMfa(this.mfaCode()));
      this.toast.success('Double authentification désactivée.');
      this.toggleMfaDisable();
      const user = await firstValueFrom(this.authService.getMe());
      this.auth.updateUser(user);
    } catch {
      this.toast.error('Code invalide. Réessayez.');
    } finally {
      this.mfaLoading.set(false);
    }
  }

  /* ── Verification ── */
  protected async requestVerification(): Promise<void> {
    this.verifyLoading.set(true);
    try {
      const res = await firstValueFrom(this.authService.requestVerification());
      this.toast.success(res.message ?? 'Demande de vérification envoyée.');
    } catch {
      // error interceptor shows toast
    } finally {
      this.verifyLoading.set(false);
    }
  }
}
