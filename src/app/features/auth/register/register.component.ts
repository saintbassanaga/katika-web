import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notification/toast.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

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
  styles: [`
    /* ─── Root ────────────────────────────────────── */
    .page {
      min-height: 100svh; background: #0F2240;
      display: flex; flex-direction: column;
      position: relative; overflow: hidden;
    }

    /* ─── Orbs ────────────────────────────────────── */
    .orb { position: absolute; border-radius: 50%; pointer-events: none; }
    .orb-a {
      width: 340px; height: 340px; top: -15%; left: -14%;
      background: radial-gradient(circle, rgba(27,79,138,.32) 0%, transparent 70%);
    }
    .orb-b {
      width: 260px; height: 260px; bottom: 5%; right: -10%;
      background: radial-gradient(circle, rgba(201,146,13,.28) 0%, transparent 70%);
    }
    .orb-c {
      width: 160px; height: 160px; top: 45%; right: 20%;
      background: radial-gradient(circle, rgba(27,79,138,.12) 0%, transparent 70%);
    }

    /* ─── Brand bar (mobile) ─────────────────────── */
    .brand {
      position: relative; z-index: 10;
      display: flex; align-items: center; gap: .875rem;
      padding: 2rem 1.5rem 1.25rem;
    }
    .k-mark {
      width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, #C9920D, #96650A);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 22px rgba(201,146,13,.42);
    }
    .brand-text { display: flex; flex-direction: column; gap: .1rem; }
    .brand-name    { color: #fff; font-size: 1.5rem; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
    .brand-tagline { color: #F5D48A; font-size: .8125rem; font-weight: 500; letter-spacing: .01em; }

    /* ─── Form card (mobile) ─────────────────────── */
    .card {
      position: relative; z-index: 10;
      background: #fff; border-radius: 2rem 2rem 0 0;
      padding: 1.75rem 1.5rem 3.5rem; flex: 1;
    }

    /* ─── DESKTOP ────────────────────────────────── */
    @media (min-width: 768px) {
      .page { flex-direction: row; align-items: stretch; }

      /* Left brand panel */
      .brand {
        flex: 1;
        flex-direction: column; align-items: center;
        justify-content: center; text-align: center;
        padding: 3.5rem 4rem;
        gap: 1rem;
      }
      .k-mark { width: 58px; height: 58px; border-radius: 18px; }
      .brand-name    { font-size: 2.5rem; }
      .brand-tagline { font-size: .9375rem; }

      .feature-list {
        display: inline-flex; flex-direction: column;
        gap: .875rem; margin-top: 2rem;
        list-style: none; padding: 0;
        text-align: left;
      }
      .feature-item {
        display: flex; align-items: center; gap: .75rem;
        color: rgba(226,232,240,.78); font-size: .875rem; font-weight: 500;
      }
      .feature-dot {
        width: 34px; height: 34px; flex-shrink: 0;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
      }

      /* Right form panel */
      .card {
        flex: 1; border-radius: 0;
        display: flex; flex-direction: column;
        align-items: center; justify-content: flex-start;
        padding: 3rem 2rem; min-height: 100svh;
        box-shadow: -32px 0 80px rgba(0,0,0,.15);
        overflow-y: auto;
      }
      .card-inner { width: 100%; max-width: 460px; }
    }
    @media (max-width: 767px) {
      .feature-list { display: none; }
      .card-inner   { width: 100%; }
    }

    /* ─── Form ──────────────────────────────────── */
    .card-title {
      font-size: 1.375rem; font-weight: 700; color: #0F2240;
      margin: 0 0 .25rem; letter-spacing: -.02em;
    }
    .card-sub { font-size: .875rem; color: #64748B; margin: 0 0 1.625rem; }

    .fields { display: flex; flex-direction: column; gap: 1rem; }

    .label {
      display: block; font-size: .8125rem; font-weight: 600;
      color: #334155; margin-bottom: .4rem; letter-spacing: .01em;
    }
    .label-opt { color: #94A3B8; font-weight: 400; }
    .input {
      width: 100%; padding: .8125rem 1rem; box-sizing: border-box;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus { border-color: #1B4F8A; background: #fff; box-shadow: 0 0 0 4px rgba(27,79,138,.08); }
    .input.error { border-color: #DC2626; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

    /* Role selector */
    .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
    .role-opt {
      display: flex; flex-direction: row; align-items: center;
      gap: .625rem; padding: .625rem .875rem;
      border: 2px solid #E2E8F0; border-radius: 12px;
      cursor: pointer; transition: all .2s; background: #F8FAFC;
    }
    .role-opt:hover { border-color: #C8DCF2; background: #EDF1F7; }
    .role-opt.selected {
      border-color: #1B4F8A; background: #E5EEF8;
      box-shadow: 0 0 0 3px rgba(27,79,138,.08);
    }
    .role-icon-wrap {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #EDF1F7; transition: background .2s;
    }
    .role-opt.selected .role-icon-wrap { background: rgba(27,79,138,.15); }
    .role-label { font-size: .875rem; font-weight: 600; color: #0F172A; }

    /* Password */
    .pwd-wrap { position: relative; }
    .pwd-toggle {
      position: absolute; right: .875rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: #94A3B8; padding: .25rem;
      display: flex; align-items: center; transition: color .15s;
    }
    .pwd-toggle:hover { color: #475569; }
    .strength-bar { display: flex; gap: 4px; margin-top: .5rem; }
    .strength-seg { flex: 1; height: 4px; border-radius: 99px; background: #E2E8F0; transition: background .3s; }
    .strength-label { font-size: .75rem; margin-top: .3rem; font-weight: 500; }

    /* Submit */
    .btn {
      width: 100%; padding: .9375rem;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700; border: none;
      border-radius: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 52px; box-shadow: 0 4px 20px rgba(27,79,138,.38);
      transition: opacity .2s, transform .15s; font-family: inherit;
    }
    .btn:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
    .btn:disabled { opacity: .55; cursor: not-allowed; }
    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .err { font-size: .75rem; color: #DC2626; margin: .3rem 0 0; }
    .login-link { text-align: center; font-size: .875rem; color: #64748B; margin-top: 1.25rem; }
    .login-link a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }
  `],
  template: `
    <div class="page">
      <div class="orb orb-a orb-1"></div>
      <div class="orb orb-b orb-2"></div>
      <div class="orb orb-c"></div>

      <!-- ── Brand panel ──────────────────────────── -->
      <div class="brand animate-fade">
        <div class="k-mark">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9"
                  stroke="#fff" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">Katika</span>
          <span class="brand-tagline">Paiements sécurisés au Cameroun</span>
        </div>

        <!-- Desktop feature list -->
        <ul class="feature-list">
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(27,79,138,.25)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            Argent bloqué jusqu'à confirmation
          </li>
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(201,146,13,.2)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5D48A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            Retraits Mobile Money rapides
          </li>
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(16,185,129,.2)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            Protection acheteur & vendeur
          </li>
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(139,92,246,.18)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            Résolution de litiges en 48h
          </li>
        </ul>
      </div>

      <!-- ── Form panel ───────────────────────────── -->
      <div class="card animate-card">
        <div class="card-inner">
          <p class="card-title">{{ 'auth.register.title' | translate }}</p>
          <p class="card-sub">{{ 'auth.register.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="fields">

            <!-- Names -->
            <div class="grid-2">
              <div>
                <label class="label">{{ 'auth.register.firstName' | translate }}</label>
                <input type="text" formControlName="firstName" [placeholder]="'auth.register.firstNamePh' | translate"
                       class="input" [class.error]="isInvalid('firstName')" />
                @if (isInvalid('firstName')) {
                  <p class="err">{{ 'auth.register.firstNameError' | translate }}</p>
                }
              </div>
              <div>
                <label class="label">{{ 'auth.register.lastName' | translate }}</label>
                <input type="text" formControlName="lastName" [placeholder]="'auth.register.lastNamePh' | translate"
                       class="input" [class.error]="isInvalid('lastName')" />
                @if (isInvalid('lastName')) {
                  <p class="err">{{ 'auth.register.lastNameError' | translate }}</p>
                }
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="label">{{ 'auth.register.phone' | translate }}</label>
              <app-phone-input formControlName="phone" />
            </div>

            <!-- Email -->
            <div>
              <label class="label">{{ 'auth.register.email' | translate }} <span class="label-opt">{{ 'common.optional' | translate }}</span></label>
              <input type="email" formControlName="email" [placeholder]="'auth.register.emailPh' | translate"
                     class="input" [class.error]="isInvalid('email')" />
              @if (isInvalid('email')) {
                <p class="err">Adresse email invalide</p>
              }
            </div>

            <!-- Role -->
            <div>
              <label class="label">{{ 'auth.register.role' | translate }}</label>
              <div class="role-grid">
                <!-- Buyer -->
                <label class="role-opt" [class.selected]="form.get('role')?.value === 'BUYER'">
                  <input type="radio" formControlName="role" value="BUYER" style="display:none" />
                  <div class="role-icon-wrap">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                         [attr.stroke]="form.get('role')?.value === 'BUYER' ? '#1B4F8A' : '#94A3B8'"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19a2 2 0 001.99-1.74L23 6H6"/>
                    </svg>
                  </div>
                  <span class="role-label">{{ 'auth.register.buyer' | translate }}</span>
                </label>
                <!-- Seller -->
                <label class="role-opt" [class.selected]="form.get('role')?.value === 'SELLER'">
                  <input type="radio" formControlName="role" value="SELLER" style="display:none" />
                  <div class="role-icon-wrap">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                         [attr.stroke]="form.get('role')?.value === 'SELLER' ? '#1B4F8A' : '#94A3B8'"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <span class="role-label">{{ 'auth.register.seller' | translate }}</span>
                </label>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="label">{{ 'auth.register.password' | translate }}</label>
              <div class="pwd-wrap">
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                       placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial"
                       class="input" style="padding-right:3rem"
                       [class.error]="isInvalid('password')" />
                <button type="button" (click)="showPwd.set(!showPwd())" class="pwd-toggle"
                        [attr.aria-label]="showPwd() ? 'Masquer' : 'Afficher'">
                  @if (showPwd()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                </button>
              </div>
              @if (form.get('password')?.value) {
                <div class="strength-bar">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="strength-seg"
                         [style.background]="i <= strengthScore() ? strengthColor() : '#E2E8F0'"></div>
                  }
                </div>
                <p class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</p>
              }
            </div>

            <!-- Confirm password -->
            <div>
              <label class="label">{{ 'auth.register.confirmPassword' | translate }}</label>
              <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
                     placeholder="••••••••" class="input"
                     [class.error]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched" />
              @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="err">{{ 'auth.register.mismatchError' | translate }}</p>
              }
            </div>

            <!-- Submit -->
            <button type="submit" class="btn" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <span class="spinner"></span>
                Inscription en cours…
              } @else {
                {{ 'auth.register.submit' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>

          <p class="login-link">
            {{ 'auth.register.hasAccount' | translate }}
            <a routerLink="/auth/login">{{ 'auth.register.signIn' | translate }}</a>
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
