import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent],
  styles: [`
    /* ─── Root ───────────────────────────────────── */
    .login-root {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      background: #0F2240;
      position: relative;
      overflow: hidden;
    }

    /* ─── Orbs (shared) ─────────────────────────── */
    .orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .orb-a {
      width: 420px; height: 420px; top: -18%; left: -18%;
      background: radial-gradient(circle, rgba(27,79,138,.38) 0%, transparent 70%);
    }
    .orb-b {
      width: 280px; height: 280px; bottom: 10%; right: -12%;
      background: radial-gradient(circle, rgba(201,146,13,.28) 0%, transparent 70%);
    }
    .orb-c {
      width: 200px; height: 200px; bottom: 40%; left: 5%;
      background: radial-gradient(circle, rgba(27,79,138,.15) 0%, transparent 70%);
    }

    /* ─── MOBILE layout ─────────────────────────── */
    .brand-area {
      position: relative; z-index: 10;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      flex: 1;
      padding: 3.5rem 1.5rem 2rem;
      text-align: center;
    }
    .k-mark {
      width: 68px; height: 68px;
      background: linear-gradient(135deg, #C9920D, #96650A);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.25rem;
      box-shadow: 0 10px 40px rgba(201,146,13,.45);
    }
    .brand-name {
      color: #fff; font-size: 2.5rem; font-weight: 800;
      letter-spacing: -0.04em; margin: 0 0 .5rem;
    }
    .brand-sub {
      color: #F5D48A; font-size: .9rem;
      font-weight: 500; margin: 0; letter-spacing: .01em;
    }
    .form-card {
      position: relative; z-index: 10;
      background: #fff;
      border-radius: 2rem 2rem 0 0;
      padding: 2.25rem 1.5rem 3rem;
    }

    /* ─── DESKTOP layout ────────────────────────── */
    @media (min-width: 768px) {
      .login-root {
        flex-direction: row;
      }

      /* Left brand panel */
      .brand-area {
        flex: 1;
        padding: 3rem 4rem;
        align-items: flex-start;
        text-align: left;
        justify-content: center;
      }
      .brand-name { font-size: 3rem; }
      .brand-sub  { font-size: .9375rem; font-weight: 500; }

      /* Feature list — only visible on desktop */
      .feature-list { display: flex; flex-direction: column; gap: .875rem; margin-top: 2.5rem; }
      .feature-item {
        display: flex; align-items: center; gap: .75rem;
        color: rgba(226,232,240,.75); font-size: .875rem; font-weight: 500;
      }
      .feature-dot {
        width: 32px; height: 32px; flex-shrink: 0;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
      }

      /* Right form panel */
      .form-card {
        flex: 1;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 4rem;
        min-height: 100svh;
        margin-left: auto;
        box-shadow: -32px 0 80px rgba(0,0,0,.15);
      }
      .form-inner {
        width: 100%;
        max-width: 380px;
      }
    }

    /* ─── Form elements ─────────────────────────── */
    .form-title {
      font-size: 1.5rem; font-weight: 700;
      color: #0F2240; margin: 0 0 .3rem;
      letter-spacing: -.02em;
    }
    .form-sub { font-size: .875rem; color: #64748B; margin: 0 0 1.75rem; }

    .field-label {
      display: block; font-size: .8125rem; font-weight: 600;
      color: #334155; margin-bottom: .45rem; letter-spacing: .01em;
    }
    .field-input {
      width: 100%; padding: .8125rem 1rem;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
      box-sizing: border-box;
    }
    .field-input:focus {
      border-color: #1B4F8A; background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }
    .field-input.error { border-color: #DC2626; }
    .field-input-wrap { position: relative; }
    .pwd-toggle {
      position: absolute; right: .875rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      font-size: 1rem; color: #94A3B8; padding: .25rem;
    }
    .err-msg { font-size: .75rem; color: #DC2626; margin: .35rem 0 0; }

    .forgot {
      font-size: .8125rem; font-weight: 600;
      color: #1B4F8A; text-decoration: none;
    }
    .forgot:hover { text-decoration: underline; }

    .submit-btn {
      width: 100%; padding: .9375rem;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700;
      border: none; border-radius: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 52px; font-family: inherit;
      box-shadow: 0 4px 20px rgba(27,79,138,.38);
      transition: opacity .2s, transform .15s;
    }
    .submit-btn:hover:not(:disabled) { opacity: .91; transform: translateY(-1px); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: .52; cursor: not-allowed; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .form-fields { display: flex; flex-direction: column; gap: 1.125rem; }
    .register-link { text-align: center; font-size: .875rem; color: #64748B; margin-top: 1.5rem; }
    .register-link a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .register-link a:hover { text-decoration: underline; }

    /* Hide feature list on mobile */
    .feature-list { display: none; }
  `],
  template: `
    <div class="login-root">
      <div class="orb orb-a orb-1"></div>
      <div class="orb orb-b orb-2"></div>
      <div class="orb orb-c"></div>

      <!-- LEFT: Brand panel -->
      <div class="brand-area animate-entry">
        <div class="k-mark">
          <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9"
                  stroke="#fff" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="brand-name">Katika</h1>
        <p class="brand-sub">Paiements sécurisés au Cameroun</p>

        <!-- Desktop-only feature list -->
        <ul class="feature-list">
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(27,79,138,.25)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#74B3F0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            Paiements séquestrés & sécurisés
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
            <div class="feature-dot" style="background:rgba(245,158,11,.18)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            Règlement rapide des litiges
          </li>
          <li class="feature-item">
            <div class="feature-dot" style="background:rgba(139,92,246,.18)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            Retraits Mobile Money instantanés
          </li>
        </ul>
      </div>

      <!-- RIGHT: Form panel -->
      <div class="form-card animate-card">
        <div class="form-inner">
          <p class="form-title">Connexion</p>
          <p class="form-sub">Bienvenue ! Entrez vos identifiants.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-fields">

            <div>
              <label class="field-label">Numéro de téléphone</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                <p class="err-msg">Numéro de téléphone requis</p>
              }
            </div>

            <div>
              <label class="field-label">Mot de passe</label>
              <div class="field-input-wrap">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="field-input"
                  [class.error]="form.get('password')?.invalid && form.get('password')?.touched"
                  style="padding-right:3rem"
                />
                <button type="button" (click)="showPassword.set(!showPassword())"
                        class="pwd-toggle"
                        [attr.aria-label]="showPassword() ? 'Masquer' : 'Afficher'">
                  {{ showPassword() ? '🙈' : '👁' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="err-msg">Mot de passe requis</p>
              }
            </div>

            <div style="text-align:right">
              <a routerLink="/auth/forgot-password" class="forgot">Mot de passe oublié ?</a>
            </div>

            <button type="submit" class="submit-btn"
                    [disabled]="form.invalid || auth.loading()">
              @if (auth.loading()) {
                <span class="spinner"></span>
                Connexion en cours…
              } @else {
                Se connecter
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>

          <p class="register-link">
            Pas encore de compte ?
            <a routerLink="/auth/register">Créer un compte</a>
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
