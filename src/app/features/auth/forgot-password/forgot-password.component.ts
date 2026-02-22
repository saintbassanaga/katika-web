import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notification/toast.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('newPassword')?.value === c.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent],
  styles: [`
    .root {
      min-height: 100svh;
      background: #0F2240;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 1.5rem;
      position: relative; overflow: hidden;
    }

    /* Orbs */
    .orb {
      position: absolute; border-radius: 50%; pointer-events: none;
    }
    .orb-a {
      width: 380px; height: 380px; top: -20%; right: -15%;
      background: radial-gradient(circle, rgba(201,146,13,.2) 0%, transparent 70%);
    }
    .orb-b {
      width: 250px; height: 250px; bottom: -10%; left: -10%;
      background: radial-gradient(circle, rgba(27,79,138,.25) 0%, transparent 70%);
    }

    /* Card */
    .card {
      position: relative; z-index: 10;
      width: 100%; max-width: 420px;
      background: #fff; border-radius: 24px;
      padding: 2.25rem 2rem 2.5rem;
      box-shadow: 0 24px 80px rgba(0,0,0,.35);
    }

    /* Brand mark */
    .brand {
      display: flex; align-items: center; gap: .75rem;
      margin-bottom: 2rem;
    }
    .k-mark {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, #C9920D, #96650A);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(201,146,13,.35);
      flex-shrink: 0;
    }
    .brand-label { font-size: 1.125rem; font-weight: 800; color: #0F2240; letter-spacing: -.02em; }

    /* Step indicator */
    .steps {
      display: flex; gap: .375rem; margin-bottom: 1.75rem;
    }
    .step-dot {
      height: 4px; border-radius: 99px; background: #E2E8F0;
      flex: 1; transition: background .3s;
    }
    .step-dot.active { background: #1B4F8A; }
    .step-dot.done   { background: #059669; }

    /* Heading */
    .heading { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 .35rem; letter-spacing: -.02em; }
    .sub     { font-size: .875rem; color: #64748B; margin: 0 0 1.75rem; line-height: 1.5; }

    /* Fields */
    .field { margin-bottom: 1.125rem; }
    .label {
      display: block; font-size: .8125rem; font-weight: 600;
      color: #334155; margin-bottom: .4rem;
    }
    .input {
      width: 100%; padding: .8125rem 1rem; box-sizing: border-box;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus { border-color: #1B4F8A; background: #fff; box-shadow: 0 0 0 4px rgba(27,79,138,.08); }
    .input.error { border-color: #DC2626; }
    .err { font-size: .75rem; color: #DC2626; margin: .3rem 0 0; }

    .input-wrap { position: relative; }
    .eye-btn {
      position: absolute; right: .875rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #94A3B8; padding: .25rem;
    }

    /* OTP row */
    .otp-row { display: flex; gap: .5rem; }
    .otp-cell {
      flex: 1; height: 56px; text-align: center;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: 1.375rem; font-weight: 700; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s;
    }
    .otp-cell:focus { border-color: #1B4F8A; box-shadow: 0 0 0 4px rgba(27,79,138,.08); }

    /* Buttons */
    .btn-primary {
      width: 100%; padding: .9375rem; border-radius: 14px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      box-shadow: 0 4px 20px rgba(27,79,138,.35);
      transition: opacity .2s, transform .15s;
      min-height: 52px; margin-top: 1.5rem;
    }
    .btn-primary:hover:not(:disabled) { opacity: .91; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Back link */
    .back-row {
      display: flex; align-items: center; justify-content: center;
      gap: .375rem; margin-top: 1.25rem;
      font-size: .875rem; color: #64748B;
    }
    .back-row a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .back-row a:hover { text-decoration: underline; }

    /* Success state */
    .success-icon {
      width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #059669, #047857);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(5,150,105,.3);
    }
    .success-heading { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 .5rem; letter-spacing: -.02em; text-align: center; }
    .success-sub { font-size: .875rem; color: #64748B; text-align: center; line-height: 1.6; margin: 0 0 2rem; }
    .phone-pill {
      display: inline-block; background: #E5EEF8; color: #1B4F8A;
      font-weight: 700; border-radius: 8px; padding: .25rem .625rem;
      font-size: .875rem;
    }
  `],
  template: `
    <div class="root">
      <div class="orb orb-a orb-1"></div>
      <div class="orb orb-b orb-2"></div>

      <div class="card animate-entry">

        <!-- Brand -->
        <div class="brand">
          <div class="k-mark">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 5v18M7 14l10-9M7 14l10 9"
                    stroke="#fff" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="brand-label">Katika</span>
        </div>

        <!-- Step dots -->
        <div class="steps">
          <div class="step-dot" [class.done]="step() > 1" [class.active]="step() === 1"></div>
          <div class="step-dot" [class.done]="step() > 2" [class.active]="step() === 2"></div>
          <div class="step-dot" [class.done]="step() > 3" [class.active]="step() === 3"></div>
        </div>

        <!-- ── STEP 1 : Phone ─────────────────────── -->
        @if (step() === 1) {
          <p class="heading">Mot de passe oublié</p>
          <p class="sub">Entrez votre numéro de téléphone. Nous vous enverrons un code de réinitialisation par SMS.</p>

          <form [formGroup]="phoneForm" (ngSubmit)="sendCode()">
            <div class="field">
              <label class="label">Numéro de téléphone</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (phoneForm.get('phoneNumber')?.invalid && phoneForm.get('phoneNumber')?.touched) {
                <p class="err">Numéro requis</p>
              }
            </div>

            <button type="submit" class="btn-primary" [disabled]="phoneForm.invalid || loading()">
              @if (loading()) {
                <span class="spinner"></span> Envoi en cours…
              } @else {
                Envoyer le code
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>
        }

        <!-- ── STEP 2 : OTP ───────────────────────── -->
        @if (step() === 2) {
          <p class="heading">Vérification</p>
          <p class="sub">
            Code envoyé au <span class="phone-pill">+237 {{ phoneForm.value.phoneNumber }}</span><br>
            Entrez les 6 chiffres reçus par SMS.
          </p>

          <div class="otp-row">
            @for (i of [0,1,2,3,4,5]; track i) {
              <input #otpCell type="text" inputmode="numeric" maxlength="1"
                     class="otp-cell"
                     (input)="onOtpInput($event, i)"
                     (keydown)="onOtpKeydown($event, i)" />
            }
          </div>

          <button class="btn-primary" [disabled]="otpCode().length < 6 || loading()"
                  (click)="verifyCode()">
            @if (loading()) {
              <span class="spinner"></span> Vérification…
            } @else {
              Vérifier le code
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            }
          </button>

          <div class="back-row" style="margin-top:.875rem">
            <span>Pas reçu ?</span>
            <a href="#" (click)="resendCode($event)">Renvoyer le code</a>
          </div>
        }

        <!-- ── STEP 3 : New password ─────────────── -->
        @if (step() === 3) {
          <p class="heading">Nouveau mot de passe</p>
          <p class="sub">Choisissez un mot de passe fort pour sécuriser votre compte.</p>

          <form [formGroup]="resetForm" (ngSubmit)="submitReset()">

            <div class="field">
              <label class="label">Nouveau mot de passe</label>
              <div class="input-wrap">
                <input [type]="showPwd() ? 'text' : 'password'"
                       formControlName="newPassword"
                       placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial"
                       class="input" style="padding-right:3rem"
                       [class.error]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched" />
                <button type="button" class="eye-btn" (click)="showPwd.set(!showPwd())">
                  {{ showPwd() ? '🙈' : '👁' }}
                </button>
              </div>
              @if (resetForm.get('newPassword')?.errors?.['minlength'] && resetForm.get('newPassword')?.touched) {
                <p class="err">Au moins 8 caractères</p>
              }
              @if (resetForm.get('newPassword')?.errors?.['pattern'] && resetForm.get('newPassword')?.touched) {
                <p class="err">Doit contenir une majuscule, un chiffre et un caractère spécial</p>
              }
            </div>

            <div class="field">
              <label class="label">Confirmer le mot de passe</label>
              <input [type]="showPwd() ? 'text' : 'password'"
                     formControlName="confirmPassword"
                     placeholder="••••••••" class="input"
                     [class.error]="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched" />
              @if (resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched) {
                <p class="err">Les mots de passe ne correspondent pas</p>
              }
            </div>

            <button type="submit" class="btn-primary"
                    [disabled]="resetForm.invalid || loading()">
              @if (loading()) {
                <span class="spinner"></span> Enregistrement…
              } @else {
                Réinitialiser le mot de passe
              }
            </button>
          </form>
        }

        <!-- ── STEP 4 : Success ──────────────────── -->
        @if (step() === 4) {
          <div style="text-align:center">
            <div class="success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff"
                   stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p class="success-heading">Mot de passe réinitialisé !</p>
            <p class="success-sub">
              Votre mot de passe a été mis à jour avec succès.<br>
              Vous pouvez maintenant vous connecter.
            </p>
            <a routerLink="/auth/login" class="btn-primary" style="text-decoration:none;display:flex">
              Aller à la connexion
            </a>
          </div>
        }

        @if (step() < 4) {
          <div class="back-row">
            <a routerLink="/auth/login">← Retour à la connexion</a>
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
