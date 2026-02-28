import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, startWith } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('newPassword')?.value === c.get('confirmPassword')?.value
    ? null
    : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
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

        <!-- ── STEP 1 : New password ──────────────── -->
        @if (step() === 1) {
          <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-1 tracking-[-0.02em]">{{ 'auth.resetPassword.title' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-7 leading-relaxed">{{ 'auth.resetPassword.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()">

            <!-- New password field -->
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.newPassword' | translate }}</label>
              <div class="relative">
                <input [type]="showPwd() ? 'text' : 'password'"
                       formControlName="newPassword"
                       [placeholder]="'auth.register.passwordPh' | translate"
                       class="w-full px-4 py-[.8125rem] pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                       [class.border-error]="form.get('newPassword')?.invalid && form.get('newPassword')?.touched" />
                <button type="button"
                        class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600"
                        (click)="showPwd.set(!showPwd())">
                  @if (showPwd()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              <!-- Real-time security requirements checklist -->
              @if (pwdValue().length > 0) {
                <div class="mt-3 grid grid-cols-1 gap-1.5 px-0.5">
                  @for (req of requirements(); track req.key) {
                    <div class="flex items-center gap-2 text-[.75rem] transition-colors duration-200"
                         [class]="req.met ? 'text-success' : 'text-slate-400'">
                      <div class="w-[16px] h-[16px] rounded-full flex items-center justify-center shrink-0 border transition-all duration-200"
                           [class]="req.met ? 'bg-success border-success' : 'bg-transparent border-slate-300'">
                        @if (req.met) {
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        }
                      </div>
                      <span>{{ req.label | translate }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Confirm password field -->
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'auth.forgotPassword.confirmPassword' | translate }}</label>
              <input [type]="showPwd() ? 'text' : 'password'"
                     formControlName="confirmPassword"
                     placeholder="••••••••"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="form.errors?.['mismatch'] && form.get('confirmPassword')?.touched" />
              @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'auth.register.mismatchError' | translate }}</p>
              }
            </div>

            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] mt-6 font-[inherit] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'auth.resetPassword.submitting' | translate }}
              } @else {
                {{ 'auth.resetPassword.submit' | translate }}
              }
            </button>
          </form>

          <div class="flex items-center justify-center mt-5 text-sm">
            <a routerLink="/auth/login" class="text-primary font-bold no-underline hover:underline">← {{ 'auth.forgotPassword.backToLogin' | translate }}</a>
          </div>
        }

        <!-- ── STEP 2 : Success + auto-redirect ── -->
        @if (step() === 2) {
          <div class="text-center">
            <div class="w-16 h-16 rounded-[20px] mx-auto mb-6 bg-gradient-to-br from-success to-[#047857] flex items-center justify-center shadow-[0_8px_24px_rgba(5,150,105,.3)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p class="text-[1.375rem] font-bold text-slate-900 m-0 mb-2 tracking-[-0.02em]">{{ 'auth.resetPassword.successTitle' | translate }}</p>
            <p class="text-sm text-slate-500 text-center leading-relaxed m-0 mb-5">{{ 'auth.resetPassword.successSub' | translate }}</p>

            <!-- Countdown indicator -->
            <div class="flex items-center justify-center gap-2 text-[.75rem] text-slate-400 mb-6 bg-slate-50 rounded-xl py-2.5 px-4 border border-slate-100">
              <span class="w-3.5 h-3.5 border-2 border-slate-200 border-t-primary rounded-full animate-spin shrink-0"></span>
              {{ 'auth.resetPassword.redirectIn' | translate: { count: countdown() } }}
            </div>

            <a routerLink="/auth/login"
               class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold no-underline rounded-[14px] flex items-center justify-center gap-2 min-h-[52px] shadow-[0_4px_20px_rgba(27,79,138,.35)] transition-all hover:opacity-90">
              {{ 'auth.login.submit' | translate }}
            </a>
          </div>
        }

      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly svc    = inject(AuthService);
  private readonly fb     = inject(FormBuilder);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly step      = signal(1);
  protected readonly loading   = signal(false);
  protected readonly showPwd   = signal(false);
  protected readonly countdown = signal(5);

  private token = '';
  private redirectTimer?: ReturnType<typeof setInterval>;

  protected readonly form = this.fb.group({
    newPassword:     ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  // Track form value as a signal for real-time requirements
  private readonly formValues = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
  );

  protected readonly pwdValue     = computed(() => this.formValues()?.newPassword     ?? '');
  protected readonly confirmValue = computed(() => this.formValues()?.confirmPassword ?? '');

  protected readonly requirements = computed(() => {
    const pwd     = this.pwdValue();
    const confirm = this.confirmValue();
    return [
      { key: 'length',    label: 'auth.resetPassword.requirements.length',    met: pwd.length >= 8 },
      { key: 'uppercase', label: 'auth.resetPassword.requirements.uppercase',  met: /[A-Z]/.test(pwd) },
      { key: 'number',    label: 'auth.resetPassword.requirements.number',     met: /\d/.test(pwd) },
      { key: 'special',   label: 'auth.resetPassword.requirements.special',    met: /[^A-Za-z0-9]/.test(pwd) },
      { key: 'match',     label: 'auth.resetPassword.requirements.match',      met: pwd.length > 0 && pwd === confirm },
    ];
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }
    this.token = token;
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearInterval(this.redirectTimer);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await firstValueFrom(this.svc.resetPassword({
        token:           this.token,
        newPassword:     this.form.value.newPassword!,
        confirmPassword: this.form.value.confirmPassword!,
      }));
      this.step.set(2);
      this.startRedirectCountdown();
    } catch {
      // error interceptor shows toast
    } finally {
      this.loading.set(false);
    }
  }

  private startRedirectCountdown(): void {
    this.redirectTimer = setInterval(() => {
      const next = this.countdown() - 1;
      this.countdown.set(next);
      if (next <= 0) {
        clearInterval(this.redirectTimer);
        this.router.navigate(['/auth/login']);
      }
    }, 1000);
  }
}
