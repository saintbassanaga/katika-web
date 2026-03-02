import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notification/toast.service';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';

function passwordStrength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('password')?.value === c.get('confirmPassword')?.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent, TranslatePipe],
  template: `
    <div class="min-h-[100svh] bg-dark flex flex-col relative overflow-hidden md:flex-row md:items-stretch">

      <!-- Orbs -->
      <div class="absolute rounded-full pointer-events-none w-[340px] h-[340px] top-[-15%] left-[-14%] bg-[radial-gradient(circle,rgba(27,79,138,.32)_0%,transparent_70%)] orb-1"></div>
      <div class="absolute rounded-full pointer-events-none w-[260px] h-[260px] bottom-[5%] right-[-10%] bg-[radial-gradient(circle,rgba(201,146,13,.28)_0%,transparent_70%)] orb-2"></div>
      <div class="absolute rounded-full pointer-events-none w-[160px] h-[160px] top-[45%] right-[20%] bg-[radial-gradient(circle,rgba(27,79,138,.12)_0%,transparent_70%)]"></div>

      <!-- Brand panel -->
      <div class="relative z-10 flex items-center gap-3.5 px-6 pt-8 pb-5 animate-fade
                  md:flex-1 md:flex-col md:items-center md:justify-center md:text-center md:px-16 md:py-14 md:gap-4">
        <div class="w-[46px] h-[46px] rounded-[14px] shrink-0 bg-gradient-to-br from-gold to-[#96650A] flex items-center justify-center shadow-[0_6px_22px_rgba(201,146,13,.42)]
                    md:w-[58px] md:h-[58px] md:rounded-[18px]">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex flex-col gap-[.1rem]">
          <span class="text-white text-2xl font-extrabold tracking-[-0.03em] leading-none md:text-[2.5rem]">Katika</span>
          <span class="text-[#F5D48A] text-[.8125rem] font-medium tracking-[.01em] md:text-[.9375rem]">Paiements sécurisés au Cameroun</span>
        </div>

        <!-- Desktop feature list -->
        <ul class="hidden md:inline-flex md:flex-col gap-3.5 mt-8 list-none p-0 text-left">
          <li class="flex items-center gap-3 text-slate-200/78 text-sm font-medium">
            <div class="w-[34px] h-[34px] shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(27,79,138,.25)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            Argent bloqué jusqu'à confirmation
          </li>
          <li class="flex items-center gap-3 text-slate-200/78 text-sm font-medium">
            <div class="w-[34px] h-[34px] shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(201,146,13,.2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5D48A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            Retraits Mobile Money rapides
          </li>
          <li class="flex items-center gap-3 text-slate-200/78 text-sm font-medium">
            <div class="w-[34px] h-[34px] shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(16,185,129,.2)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            Protection acheteur &amp; vendeur
          </li>
          <li class="flex items-center gap-3 text-slate-200/78 text-sm font-medium">
            <div class="w-[34px] h-[34px] shrink-0 rounded-[10px] flex items-center justify-center bg-[rgba(139,92,246,.18)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            Résolution de litiges en 48h
          </li>
        </ul>
      </div>

      <!-- Form panel -->
      <div class="relative z-10 bg-white rounded-t-[2rem] flex-1 px-6 pt-7 pb-14 animate-card
                  md:rounded-none md:flex md:flex-col md:items-center md:justify-start md:px-8 md:py-12 md:min-h-[100svh] md:shadow-[-32px_0_80px_rgba(0,0,0,.15)] md:overflow-y-auto">
        <div class="w-full md:max-w-[460px]">
          <p class="text-[1.375rem] font-bold text-dark m-0 mb-1 tracking-[-0.02em]">{{ 'auth.register.title' | translate }}</p>
          <p class="text-sm text-slate-500 m-0 mb-[1.625rem]">{{ 'auth.register.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">

            <!-- Names -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.firstName' | translate }}</label>
                <input type="text" formControlName="firstName" [placeholder]="'auth.register.firstNamePh' | translate"
                       class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                       [class.border-error]="isInvalid('firstName')" />
                @if (isInvalid('firstName')) {
                  <p class="text-xs text-error mt-1">{{ 'auth.register.firstNameError' | translate }}</p>
                }
              </div>
              <div>
                <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.lastName' | translate }}</label>
                <input type="text" formControlName="lastName" [placeholder]="'auth.register.lastNamePh' | translate"
                       class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                       [class.border-error]="isInvalid('lastName')" />
                @if (isInvalid('lastName')) {
                  <p class="text-xs text-error mt-1">{{ 'auth.register.lastNameError' | translate }}</p>
                }
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.phone' | translate }}</label>
              <app-phone-input formControlName="phone" />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">
                {{ 'auth.register.email' | translate }}
                <span class="text-slate-400 font-normal">{{ 'common.optional' | translate }}</span>
              </label>
              <input type="email" formControlName="email" [placeholder]="'auth.register.emailPh' | translate"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="isInvalid('email')" />
              @if (isInvalid('email')) {
                <p class="text-xs text-error mt-1">Adresse email invalide</p>
              }
            </div>

            <!-- Role -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.role' | translate }}</label>
              <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-row items-center gap-2.5 px-3.5 py-2.5 border-2 rounded-xl cursor-pointer transition-all bg-slate-50 hover:border-[#C8DCF2] hover:bg-page"
                       [class.border-primary]="form.get('role')?.value === 'BUYER'"
                       [class.bg-primary-lt]="form.get('role')?.value === 'BUYER'"
                       [class.shadow-[0_0_0_3px_rgba(27,79,138,.08)]]="form.get('role')?.value === 'BUYER'"
                       [class.border-slate-200]="form.get('role')?.value !== 'BUYER'">
                  <input type="radio" formControlName="role" value="BUYER" class="sr-only" />
                  <div class="w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center bg-page transition-colors"
                       [class.bg-primary/15]="form.get('role')?.value === 'BUYER'">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                         [attr.stroke]="form.get('role')?.value === 'BUYER' ? '#1B4F8A' : '#94A3B8'"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19a2 2 0 001.99-1.74L23 6H6"/>
                    </svg>
                  </div>
                  <span class="text-sm font-semibold text-slate-900">{{ 'auth.register.buyer' | translate }}</span>
                </label>
                <label class="flex flex-row items-center gap-2.5 px-3.5 py-2.5 border-2 rounded-xl cursor-pointer transition-all bg-slate-50 hover:border-[#C8DCF2] hover:bg-page"
                       [class.border-primary]="form.get('role')?.value === 'SELLER'"
                       [class.bg-primary-lt]="form.get('role')?.value === 'SELLER'"
                       [class.border-slate-200]="form.get('role')?.value !== 'SELLER'">
                  <input type="radio" formControlName="role" value="SELLER" class="sr-only" />
                  <div class="w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center bg-page transition-colors"
                       [class.bg-primary/15]="form.get('role')?.value === 'SELLER'">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                         [attr.stroke]="form.get('role')?.value === 'SELLER' ? '#1B4F8A' : '#94A3B8'"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <span class="text-sm font-semibold text-slate-900">{{ 'auth.register.seller' | translate }}</span>
                </label>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.password' | translate }}</label>
              <div class="relative">
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                       placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial"
                       class="w-full px-4 py-[.8125rem] pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                       [class.border-error]="isInvalid('password')" />
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600">
                  @if (showPwd()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                </button>
              </div>
              @if (form.get('password')?.value) {
                <div class="flex gap-1 mt-2">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="flex-1 h-1 rounded-full transition-all"
                         [style.background]="i <= strengthScore() ? strengthColor() : '#E2E8F0'"></div>
                  }
                </div>
                <p class="text-xs mt-1 font-medium" [style.color]="strengthColor()">{{ strengthLabel() }}</p>
              }
            </div>

            <!-- Confirm password -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'auth.register.confirmPassword' | translate }}</label>
              <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
                     placeholder="••••••••"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched" />
              @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="text-xs text-error mt-1">{{ 'auth.register.mismatchError' | translate }}</p>
              }
            </div>

            <!-- Submit -->
            <button type="submit"
                    class="w-full py-[.9375rem] bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 min-h-[52px] shadow-[0_4px_20px_rgba(27,79,138,.38)] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed font-[inherit]"
                    [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                Inscription en cours…
              } @else {
                {{ 'auth.register.submit' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>

          <p class="text-center text-sm text-slate-500 mt-5">
            {{ 'auth.register.hasAccount' | translate }}
            <a routerLink="/auth/login" class="text-primary font-bold no-underline hover:underline">{{ 'auth.register.signIn' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly svc    = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly showPwd = signal(false);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.group({
    firstName:       ['', [Validators.required, Validators.minLength(2)]],
    lastName:        ['', [Validators.required, Validators.minLength(2)]],
    phone:           ['', Validators.required],
    email:           ['', Validators.email],
    role:            ['BUYER', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  protected isInvalid(f: string) { const c = this.form.get(f); return c?.invalid && c?.touched; }

  protected strengthScore = computed(() => passwordStrength(this.form.get('password')?.value ?? ''));
  protected strengthColor = computed(() => ['#EF4444','#EF4444','#F59E0B','#3A7BC8','#10B981'][this.strengthScore()]);
  protected strengthLabel = computed(() => ['','Très faible','Faible','Bon','Excellent'][this.strengthScore()]);

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.svc.register({
      fullName: `${v.firstName!} ${v.lastName!}`.trim(),
      phoneNumber: v.phone!,
      password: v.password!,
      email: v.email || undefined,
    }).subscribe({
      next:     () => { this.toast.success('Compte créé ! Connectez-vous.'); this.router.navigate(['/auth/login']); },
      error:    () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
