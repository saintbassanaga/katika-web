import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: [`
    .page { min-height: 100svh; background: #EDF1F7; }

    .topbar {
      background: #0F2240;
      padding: 1rem 1.25rem;
      display: flex; align-items: center; gap: .875rem;
    }
    .back-btn {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,.1); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0; transition: background .2s;
    }
    .back-btn:hover { background: rgba(255,255,255,.18); }
    .topbar-title { color: #fff; font-size: 1rem; font-weight: 700; letter-spacing: -.01em; }

    .content { padding: 1.25rem; max-width: 560px; margin: 0 auto; }

    /* Avatar section */
    .avatar-section {
      display: flex; flex-direction: column; align-items: center;
      background: #fff; border-radius: 20px; padding: 2rem 1.5rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 4px rgba(15,23,42,.06);
    }
    .avatar-circle {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 1.75rem; font-weight: 700;
      margin-bottom: 1rem;
      box-shadow: 0 6px 24px rgba(27,79,138,.3);
    }
    .avatar-name { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 .2rem; }
    .avatar-role {
      font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .07em; color: #92680A;
      background: #FDF4DC; border: 1px solid rgba(201,146,13,.2);
      padding: .25rem .75rem; border-radius: 99px;
    }

    /* Form card */
    .form-card {
      background: #fff; border-radius: 20px; padding: 1.5rem;
      box-shadow: 0 1px 4px rgba(15,23,42,.06);
    }
    .card-title { font-size: .9375rem; font-weight: 700; color: #0F172A; margin: 0 0 1.25rem; }

    .field { margin-bottom: 1.125rem; }
    .label {
      display: block; font-size: .8125rem; font-weight: 600;
      color: #334155; margin-bottom: .4rem; letter-spacing: .01em;
    }
    .label-opt { color: #94A3B8; font-weight: 400; }
    .input {
      width: 100%; padding: .8125rem 1rem;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit; box-sizing: border-box;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus {
      border-color: #1B4F8A; background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }
    .input.error { border-color: #DC2626; }
    .hint { font-size: .75rem; color: #94A3B8; margin: .3rem 0 0; }
    .err  { font-size: .75rem; color: #DC2626; margin: .3rem 0 0; }

    /* Actions */
    .actions { display: flex; gap: .75rem; margin-top: 1.5rem; }
    .btn-primary {
      flex: 1; padding: .875rem;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700;
      border: none; border-radius: 14px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      box-shadow: 0 4px 16px rgba(27,79,138,.35); font-family: inherit;
      transition: opacity .2s, transform .15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: .91; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .52; cursor: not-allowed; }
    .btn-cancel {
      padding: .875rem 1.25rem;
      background: #EDF1F7; color: #475569;
      font-size: .9375rem; font-weight: 600;
      border: none; border-radius: 14px; cursor: pointer;
      font-family: inherit; text-decoration: none;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s;
    }
    .btn-cancel:hover { background: #E2E8F0; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Non-editable info row */
    .info-card {
      background: #fff; border-radius: 20px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(15,23,42,.06); margin-bottom: 1rem;
    }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.25rem; border-bottom: 1px solid #EDF1F7;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-size: .8125rem; color: #94A3B8; font-weight: 500; }
    .info-value { font-size: .875rem; color: #334155; font-weight: 600; }
    .info-locked {
      display: flex; align-items: center; gap: .375rem;
      font-size: .75rem; color: #94A3B8;
    }
  `],
  template: `
    <div class="page animate-fade">

      <!-- Top bar -->
      <div class="topbar">
        <a routerLink="/profile" class="back-btn" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <span class="topbar-title">Modifier le profil</span>
      </div>

      <div class="content">

        <!-- Avatar / identity card -->
        <div class="avatar-section animate-entry">
          <div class="avatar-circle">{{ auth.initials() }}</div>
          <p class="avatar-name">{{ auth.fullName() }}</p>
          <span class="avatar-role">{{ auth.role() }}</span>
        </div>

        <!-- Read-only info (phone + role cannot be changed here) -->
        <div class="info-card animate-entry">
          <div class="info-row">
            <span class="info-label">Téléphone</span>
            <span class="info-locked">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Non modifiable
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Rôle</span>
            <span class="info-value">{{ auth.role() }}</span>
          </div>
        </div>

        <!-- Editable form -->
        <div class="form-card animate-entry">
          <p class="card-title">Informations modifiables</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Full name -->
            <div class="field">
              <label class="label">Nom complet</label>
              <input
                type="text"
                formControlName="fullName"
                placeholder="Jean Fotso"
                class="input"
                [class.error]="isInvalid('fullName')"
              />
              @if (form.get('fullName')?.errors?.['required'] && form.get('fullName')?.touched) {
                <p class="err">Le nom complet est requis</p>
              }
              @if (form.get('fullName')?.errors?.['minlength'] && form.get('fullName')?.touched) {
                <p class="err">Au moins 2 caractères</p>
              }
            </div>

            <!-- Email -->
            <div class="field">
              <label class="label">
                Email <span class="label-opt">(optionnel)</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="jean@exemple.cm"
                class="input"
                [class.error]="isInvalid('email')"
              />
              @if (isInvalid('email')) {
                <p class="err">Adresse email invalide</p>
              }
              <p class="hint">Utilisé pour les notifications et la récupération de compte.</p>
            </div>

            <!-- CNI number -->
            <div class="field">
              <label class="label">
                Numéro CNI <span class="label-opt">(optionnel)</span>
              </label>
              <input
                type="text"
                formControlName="cniNumber"
                placeholder="123456789"
                class="input"
              />
              <p class="hint">Carte Nationale d'Identité — requis pour certaines opérations.</p>
            </div>

            <!-- Actions -->
            <div class="actions">
              <a routerLink="/profile" class="btn-cancel">Annuler</a>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="form.invalid || form.pristine || auth.loading()"
              >
                @if (auth.loading()) {
                  <span class="spinner"></span>
                  Enregistrement…
                } @else {
                  Enregistrer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    fullName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:     ['', Validators.email],
    cniNumber: [''],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        fullName: user.fullName,
        email:    user.email ?? '',
      });
    }
  }

  protected isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.form.pristine) return;
    const v = this.form.value;
    this.auth.updateProfile({
      fullName:  v.fullName!,
      email:     v.email   || undefined,
      cniNumber: v.cniNumber || undefined,
    });
  }
}
