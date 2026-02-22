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
  styles: [`
    .page { min-height: 100svh; background: #EDF1F7; }

    /* Topbar */
    .topbar {
      background: #0F2240; padding: 1rem 1.25rem;
      display: flex; align-items: center; gap: .875rem;
    }
    .back-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,.1); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0; transition: background .2s; text-decoration: none;
    }
    .back-btn:hover { background: rgba(255,255,255,.18); }
    .topbar-title { color: #fff; font-size: 1rem; font-weight: 700; letter-spacing: -.01em; }

    .content { padding: 1.25rem; max-width: 560px; margin: 0 auto; }

    /* Section title */
    .section-label {
      font-size: .6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: #94A3B8; margin: 1.25rem 0 .5rem .25rem;
    }
    .section-label:first-child { margin-top: 0; }

    /* Cards */
    .card {
      background: #fff; border-radius: 20px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(15,23,42,.06); margin-bottom: .75rem;
    }

    /* Verification banner */
    .verify-banner {
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      border-radius: 20px; padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: .75rem; position: relative; overflow: hidden;
    }
    .verify-banner::before {
      content: ''; position: absolute; top: -40%; right: -10%;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(255,255,255,.07); pointer-events: none;
    }
    .verify-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
    }
    .verify-title { color: #fff; font-size: .9375rem; font-weight: 700; margin: 0 0 .2rem; }
    .verify-sub   { color: rgba(255,255,255,.7); font-size: .8125rem; margin: 0; }
    .verify-cta {
      margin-left: auto; flex-shrink: 0;
      padding: .5rem 1rem; border-radius: 10px;
      background: rgba(255,255,255,.2); color: #fff;
      font-size: .8125rem; font-weight: 700; border: none; cursor: pointer;
      font-family: inherit; transition: background .2s; white-space: nowrap;
    }
    .verify-cta:hover:not(:disabled) { background: rgba(255,255,255,.3); }
    .verify-cta:disabled { opacity: .6; cursor: not-allowed; }

    .verified-banner {
      background: linear-gradient(135deg, #059669, #047857);
      border-radius: 20px; padding: 1rem 1.5rem;
      display: flex; align-items: center; gap: .875rem;
      margin-bottom: .75rem;
    }
    .verified-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      background: rgba(255,255,255,.18);
      display: flex; align-items: center; justify-content: center;
    }
    .verified-text { color: #fff; font-size: .875rem; font-weight: 600; margin: 0; }
    .verified-sub  { color: rgba(255,255,255,.7); font-size: .75rem; margin: .1rem 0 0; }

    /* Row inside card */
    .card-row {
      display: flex; align-items: center; gap: .875rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid #F8FAFC;
    }
    .card-row:last-child { border-bottom: none; }
    .row-icon {
      width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .row-label { font-size: .875rem; font-weight: 600; color: #0F172A; }
    .row-sub   { font-size: .75rem; color: #94A3B8; margin-top: .1rem; }
    .row-action {
      margin-left: auto; flex-shrink: 0;
      padding: .375rem .875rem; border-radius: 8px;
      font-size: .8125rem; font-weight: 700; border: none; cursor: pointer;
      font-family: inherit; transition: all .2s; text-decoration: none;
    }
    .action-primary { background: #E5EEF8; color: #1B4F8A; }
    .action-primary:hover { background: #C8DCF2; }
    .action-danger  { background: #FEF2F2; color: #DC2626; }
    .action-danger:hover  { background: #FEE2E2; }

    /* Expandable form sections */
    .expand-form {
      padding: 0 1.25rem 1.25rem;
      border-top: 1px solid #EDF1F7;
      animation: slideDown .25s ease-out both;
    }
    @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

    .field { margin-bottom: 1rem; }
    .label { display: block; font-size: .8125rem; font-weight: 600; color: #334155; margin-bottom: .4rem; }
    .input {
      width: 100%; padding: .75rem 1rem; box-sizing: border-box;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus { border-color: #1B4F8A; background: #fff; box-shadow: 0 0 0 4px rgba(27,79,138,.08); }
    .input.error { border-color: #DC2626; }
    .input-wrap { position: relative; }
    .eye-btn {
      position: absolute; right: .875rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #94A3B8; padding: .25rem;
      display: flex; align-items: center; transition: color .15s;
    }
    .eye-btn:hover { color: #475569; }
    .err { font-size: .75rem; color: #DC2626; margin: .3rem 0 0; }

    .form-actions { display: flex; gap: .625rem; margin-top: 1.125rem; }
    .btn-save {
      flex: 1; padding: .75rem; border-radius: 12px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .875rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      box-shadow: 0 3px 12px rgba(27,79,138,.3);
      transition: opacity .2s;
    }
    .btn-save:disabled { opacity: .5; cursor: not-allowed; }
    .btn-cancel-sm {
      padding: .75rem 1.125rem; border-radius: 12px;
      background: #EDF1F7; color: #64748B;
      font-size: .875rem; font-weight: 600;
      border: none; cursor: pointer; font-family: inherit;
      transition: background .2s;
    }
    .btn-cancel-sm:hover { background: #E2E8F0; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* MFA disable OTP */
    .otp-row { display: flex; gap: .5rem; }
    .otp-cell {
      width: 44px; height: 52px; text-align: center;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: 1.25rem; font-weight: 700; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s;
    }
    .otp-cell:focus { border-color: #DC2626; box-shadow: 0 0 0 4px rgba(220,38,38,.08); }
  `],
  template: `
    <div class="page animate-fade">

      <!-- Topbar -->
      <div class="topbar">
        <a routerLink="/profile" class="back-btn" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <span class="topbar-title">Sécurité</span>
      </div>

      <div class="content animate-entry">

        <!-- ── Verification ─────────────────────── -->
        <p class="section-label">Vérification</p>

        @if (auth.isVerified()) {
          <div class="verified-banner">
            <div class="verified-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <p class="verified-text">Compte vérifié</p>
              <p class="verified-sub">Votre identité a été confirmée</p>
            </div>
          </div>
        } @else {
          <div class="verify-banner">
            <div class="verify-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div style="flex:1">
              <p class="verify-title">Vérifiez votre compte</p>
              <p class="verify-sub">Accédez à toutes les fonctionnalités</p>
            </div>
            <button class="verify-cta" (click)="requestVerification()" [disabled]="verifyLoading()">
              @if (verifyLoading()) { Envoi… } @else { Vérifier }
            </button>
          </div>
        }

        <!-- ── Password ─────────────────────────── -->
        <p class="section-label">Mot de passe</p>
        <div class="card">
          <div class="card-row">
            <div class="row-icon" style="background:#FFF7ED">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <p class="row-label">Mot de passe</p>
              <p class="row-sub">Dernière modification inconnue</p>
            </div>
            <button class="row-action action-primary" (click)="togglePwdForm()">
              {{ showPwdForm() ? 'Annuler' : 'Modifier' }}
            </button>
          </div>

          @if (showPwdForm()) {
            <div class="expand-form">
              <form [formGroup]="pwdForm" (ngSubmit)="changePassword()">

                <div class="field">
                  <label class="label">Mot de passe actuel</label>
                  <div class="input-wrap">
                    <input [type]="showCurrent() ? 'text' : 'password'"
                           formControlName="currentPassword"
                           placeholder="••••••••" class="input"
                           style="padding-right:3rem"
                           [class.error]="isInvalidPwd('currentPassword')" />
                    <button type="button" class="eye-btn" (click)="showCurrent.set(!showCurrent())">
                      @if (showCurrent()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (isInvalidPwd('currentPassword')) {
                    <p class="err">Mot de passe actuel requis</p>
                  }
                </div>

                <div class="field">
                  <label class="label">Nouveau mot de passe</label>
                  <div class="input-wrap">
                    <input [type]="showNew() ? 'text' : 'password'"
                           formControlName="newPassword"
                           placeholder="Min. 8 caractères, 1 maj, 1 chiffre, 1 spécial"
                           class="input" style="padding-right:3rem"
                           [class.error]="isInvalidPwd('newPassword')" />
                    <button type="button" class="eye-btn" (click)="showNew.set(!showNew())">
                      @if (showNew()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (pwdForm.get('newPassword')?.errors?.['minlength'] && pwdForm.get('newPassword')?.touched) {
                    <p class="err">Au moins 8 caractères</p>
                  }
                  @if (pwdForm.get('newPassword')?.errors?.['pattern'] && pwdForm.get('newPassword')?.touched) {
                    <p class="err">Doit contenir une majuscule, un chiffre et un caractère spécial</p>
                  }
                </div>

                <div class="field">
                  <label class="label">Confirmer le nouveau mot de passe</label>
                  <input [type]="showNew() ? 'text' : 'password'"
                         formControlName="confirmPassword"
                         placeholder="••••••••" class="input"
                         [class.error]="pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched" />
                  @if (pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched) {
                    <p class="err">Les mots de passe ne correspondent pas</p>
                  }
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-cancel-sm" (click)="togglePwdForm()">Annuler</button>
                  <button type="submit" class="btn-save" [disabled]="pwdForm.invalid || pwdLoading()">
                    @if (pwdLoading()) {
                      <span class="spinner"></span> Modification…
                    } @else {
                      Changer le mot de passe
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>

        <!-- ── 2FA ──────────────────────────────── -->
        <p class="section-label">Double authentification</p>
        <div class="card">
          <div class="card-row">
            <div class="row-icon" style="background:#F0FDF4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div>
              <p class="row-label">Authentification 2FA</p>
              <p class="row-sub" [style.color]="auth.hasMfa() ? '#16A34A' : '#94A3B8'">
                {{ auth.hasMfa() ? 'Activée — application TOTP' : 'Non activée' }}
              </p>
            </div>
            @if (auth.hasMfa()) {
              <button class="row-action action-danger" (click)="toggleMfaDisable()">
                {{ showMfaDisable() ? 'Annuler' : 'Désactiver' }}
              </button>
            } @else {
              <a routerLink="/profile/security/mfa" class="row-action action-primary">Activer</a>
            }
          </div>

          @if (showMfaDisable()) {
            <div class="expand-form">
              <p style="font-size:.8125rem;color:#64748B;margin:0 0 .875rem">
                Entrez votre code TOTP pour confirmer la désactivation :
              </p>
              <div class="otp-row">
                @for (i of [0,1,2,3,4,5]; track i) {
                  <input #mfaCell type="text" inputmode="numeric" maxlength="1"
                         class="otp-cell"
                         (input)="onMfaCellInput($event, i)"
                         (keydown)="onMfaCellKeydown($event, i)" />
                }
              </div>
              <div class="form-actions" style="margin-top:.875rem">
                <button type="button" class="btn-cancel-sm" (click)="toggleMfaDisable()">Annuler</button>
                <button type="button" class="btn-save"
                        style="background:linear-gradient(135deg,#DC2626,#B91C1C);box-shadow:0 3px 12px rgba(220,38,38,.3)"
                        [disabled]="mfaCode().length < 6 || mfaLoading()"
                        (click)="disableMfa()">
                  @if (mfaLoading()) {
                    <span class="spinner"></span> Désactivation…
                  } @else {
                    Confirmer la désactivation
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
