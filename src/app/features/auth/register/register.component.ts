import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '@core/auth/auth.service';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { TuiIcon } from '@taiga-ui/core';

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
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent, TranslatePipe, TuiIcon],
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
      padding: 2.5rem 1.5rem 2rem;
      z-index: 1;
      flex-shrink: 0;
    }

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
      width: 380px; height: 380px;
      top: -120px; left: -110px;
      background: radial-gradient(circle, rgba(27,79,138,.38) 0%, transparent 65%);
      animation: orbFloat1 9s ease-in-out infinite;
    }

    .brand-orb-2 {
      width: 260px; height: 260px;
      bottom: -60px; right: -50px;
      background: radial-gradient(circle, rgba(201,146,13,.2) 0%, transparent 65%);
      animation: orbFloat2 12s ease-in-out infinite;
    }

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
    .brand-header { display: flex; align-items: center; gap: 0.875rem; }

    .brand-logo {
      width: 44px; height: 44px;
      object-fit: contain;
      filter: drop-shadow(0 4px 16px rgba(0,0,0,.4));
    }

    .brand-name {
      font-family: 'Cormorant Garamond', 'Times New Roman', serif;
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      letter-spacing: 0.01em;
      line-height: 1;
    }

    .brand-sep {
      display: block;
      width: 40px; height: 2px;
      background: linear-gradient(90deg, transparent, #C9920D, transparent);
      margin: 0.5rem auto 0.375rem;
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
      padding: 0; margin: 2rem 0 0;
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
      width: 1px;
      flex-shrink: 0;
      background: linear-gradient(to bottom,
        transparent 0%,
        rgba(201,146,13,.18) 25%,
        rgba(245,212,138,.28) 50%,
        rgba(201,146,13,.18) 75%,
        transparent 100%);
      position: relative;
      align-self: stretch;
    }

    .split-divider::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      width: 5px; height: 5px;
      background: rgba(245,212,138,.5);
      box-shadow: 0 0 8px rgba(201,146,13,.2);
    }

    /* ── FORM PANEL ───────────────────────────────── */
    .form-side {
      background: #FEFDFB;
      border-radius: 2rem 2rem 0 0;
      padding: 2rem 1.5rem 3.5rem;
      flex: 1;
    }

    .form-inner { width: 100%; }

    .form-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #0F2240;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }

    .form-sub { font-size: 0.875rem; color: #64748B; margin: 0 0 1.5rem; }

    .field-wrap { display: flex; flex-direction: column; }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
      letter-spacing: 0.01em;
    }

    .optional { color: #94A3B8; font-weight: 400; }

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

    .names-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }

    .role-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem;
      border: 2px solid #E2E8F0;
      border-radius: 0.75rem;
      cursor: pointer;
      background: #F8F9FC;
      transition: border-color .15s, background .15s;
    }

    .role-card.active { border-color: #1B4F8A; background: #EBF4FF; }

    .role-icon {
      width: 32px; height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #EEF2F8;
      transition: background .15s;
    }

    .role-card.active .role-icon { background: rgba(27,79,138,.15); }
    .role-label { font-size: 0.875rem; font-weight: 600; color: #0F172A; }

    .strength-bars { display: flex; gap: 0.25rem; margin-top: 0.5rem; }
    .strength-bar { flex: 1; height: 3px; border-radius: 99px; background: #E2E8F0; transition: background .2s; }

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

    .footer-note { text-align: center; font-size: .875rem; color: #64748B; margin-top: 1.25rem; }
    .footer-note a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .footer-note a:hover { text-decoration: underline; }

    /* ── DESKTOP ──────────────────────────────────── */
    @media (min-width: 768px) {
      .auth-root { flex-direction: row; overflow: hidden; min-height: 100svh; }

      .brand {
        flex: 0 0 42%;
        align-items: flex-start;
        text-align: left;
        padding: 0 3rem;
        min-height: 100svh;
        justify-content: center;
        flex-shrink: 0;
      }

      .brand-header { flex-direction: column; align-items: flex-start; gap: 0; }
      .brand-logo { width: 56px; height: 56px; margin-bottom: 0.5rem; }
      .brand-name { font-size: 4rem; }
      .brand-sep { margin: 0.625rem 0 0.5rem; }
      .brand-features { display: flex; }
      .brand-circles { display: block; }
      .split-divider { display: block; }

      .form-side {
        flex: 1;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100svh;
        padding: 2.5rem 3rem;
        box-shadow: -32px 0 80px rgba(0,0,0,.12);
        overflow-y: auto;
      }

      .form-inner { max-width: 460px; width: 100%; margin: auto 0; }
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
          <div class="brand-header">
            <img src="/icons/icon-512-transparent.png" alt="Katica" class="brand-logo" />
            <h1 class="brand-name">Katica</h1>
          </div>
          <span class="brand-sep"></span>
          <p class="brand-tagline">Paiements sécurisés au Cameroun</p>

          <ul class="brand-features">
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(27,79,138,.25)">
                <tui-icon icon="@tui.shield" class="w-5 h-5" />
              </div>
              Argent bloqué jusqu'à confirmation
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(201,146,13,.2)">
                <tui-icon icon="@tui.credit-card" class="w-5 h-5" />
              </div>
              Retraits Mobile Money rapides
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(16,185,129,.2)">
                <tui-icon icon="@tui.check" class="w-4 h-4" />
              </div>
              Protection acheteur &amp; vendeur
            </li>
            <li class="bf-item">
              <div class="bf-icon" style="background:rgba(139,92,246,.18)">
                <tui-icon icon="@tui.clock" class="w-5 h-5" />
              </div>
              Résolution de litiges en 48h
            </li>
          </ul>
        </div>
      </div>

      <!-- GOLDEN DIVIDER (desktop only) -->
      <div class="split-divider"></div>

      <!-- FORM PANEL -->
      <div class="form-side animate-card">
        <div class="form-inner">
          <p class="form-title">{{ 'auth.register.title' | translate }}</p>
          <p class="form-sub">{{ 'auth.register.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display:flex;flex-direction:column;gap:1rem">

            <!-- Names -->
            <div class="names-row">
              <div class="field-wrap">
                <label class="field-label">{{ 'auth.register.firstName' | translate }}</label>
                <input type="text" formControlName="firstName"
                       [placeholder]="'auth.register.firstNamePh' | translate"
                       class="field-input" [class.is-error]="isInvalid('firstName')" />
                @if (isInvalid('firstName')) {
                  <p class="field-error">{{ 'auth.register.firstNameError' | translate }}</p>
                }
              </div>
              <div class="field-wrap">
                <label class="field-label">{{ 'auth.register.lastName' | translate }}</label>
                <input type="text" formControlName="lastName"
                       [placeholder]="'auth.register.lastNamePh' | translate"
                       class="field-input" [class.is-error]="isInvalid('lastName')" />
                @if (isInvalid('lastName')) {
                  <p class="field-error">{{ 'auth.register.lastNameError' | translate }}</p>
                }
              </div>
            </div>

            <!-- Phone -->
            <div class="field-wrap">
              <label class="field-label">{{ 'auth.register.phone' | translate }}</label>
              <app-phone-input formControlName="phone" />
            </div>

            <!-- Email -->
            <div class="field-wrap">
              <label class="field-label">
                {{ 'auth.register.email' | translate }}
                <span class="optional">{{ 'common.optional' | translate }}</span>
              </label>
              <input type="email" formControlName="email"
                     [placeholder]="'auth.register.emailPh' | translate"
                     class="field-input" [class.is-error]="isInvalid('email')" />
              @if (isInvalid('email')) {
                <p class="field-error">Adresse email invalide</p>
              }
            </div>

            <!-- Role -->
            <div class="field-wrap">
              <label class="field-label">{{ 'auth.register.role' | translate }}</label>
              <div class="role-grid">
                <label class="role-card" [class.active]="form.get('role')?.value === 'BUYER'">
                  <input type="radio" formControlName="role" value="BUYER" style="display:none" />
                  <div class="role-icon">
                    <tui-icon icon="@tui.shopping-cart" class="w-8 h-8" />
                  </div>
                  <span class="role-label">{{ 'auth.register.buyer' | translate }}</span>
                </label>
                <label class="role-card" [class.active]="form.get('role')?.value === 'SELLER'">
                  <input type="radio" formControlName="role" value="SELLER" style="display:none" />
                  <div class="role-icon">
                    <tui-icon icon="@tui.home" class="w-8 h-8" />
                  </div>
                  <span class="role-label">{{ 'auth.register.seller' | translate }}</span>
                </label>
              </div>
            </div>

            <!-- Password -->
            <div class="field-wrap">
              <label class="field-label">{{ 'auth.register.password' | translate }}</label>
              <div class="pw-wrap">
                <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                       placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial"
                       class="field-input" [class.is-error]="isInvalid('password')" />
                <button type="button" class="pw-toggle" (click)="showPwd.set(!showPwd())">
                  @if (showPwd()) {
                    <tui-icon icon="@tui.eye-off" class="w-5 h-5" />
                  } @else {
                    <tui-icon icon="@tui.eye" class="w-5 h-5" />
                  }
                </button>
              </div>
              @if (form.get('password')?.value) {
                <div class="strength-bars">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="strength-bar" [style.background]="i <= strengthScore() ? strengthColor() : '#E2E8F0'"></div>
                  }
                </div>
                <p style="font-size:.75rem;margin:.25rem 0 0;font-weight:600" [style.color]="strengthColor()">{{ strengthLabel() }}</p>
              }
            </div>

            <!-- Confirm password -->
            <div class="field-wrap">
              <label class="field-label">{{ 'auth.register.confirmPassword' | translate }}</label>
              <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
                     placeholder="••••••••"
                     class="field-input"
                     [class.is-error]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched" />
              @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="field-error">{{ 'auth.register.mismatchError' | translate }}</p>
              }
            </div>

            <!-- Submit -->
            <button type="submit" class="submit-btn" [disabled]="form.invalid || loading()">
              @if (loading()) {
                <tui-icon icon="@tui.loader-circle" class="w-4 h-4 animate-spin" />
                Inscription en cours…
              } @else {
                {{ 'auth.register.submit' | translate }}
                <tui-icon icon="@tui.arrow-right" class="w-4 h-4" />
              }
            </button>
          </form>

          <p class="footer-note">
            {{ 'auth.register.hasAccount' | translate }}
            <a routerLink="/auth/login">{{ 'auth.register.signIn' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly svc       = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly toast     = inject(ToastService);

  protected readonly showPwd = signal(false);
  protected readonly loading = signal(false);

  protected readonly form = this.fb.group({
    firstName:       ['', [Validators.required, Validators.minLength(2)]],
    lastName:        ['', [Validators.required, Validators.minLength(2)]],
    phone:           ['', Validators.required],
    email:           ['', Validators.email],
    role:            ['BUYER', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(6)]],
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
    const phone    = v.phone!;
    const password = v.password!;
    this.svc.register({
      fullName: `${v.firstName!} ${v.lastName!}`.trim(),
      phoneNumber: phone,
      password,
      email: v.email || undefined,
      role: v.role as 'BUYER' | 'SELLER',
    }).subscribe({
      next: () => {
        this.toast.success('Compte créé avec succès !');
        this.authStore.login({ phoneNumber: phone, password });
      },
      error:    () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
