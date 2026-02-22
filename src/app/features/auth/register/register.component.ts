import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent],
  styles: [`
    .page { min-height: 100svh; background: #0F2240; display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .orb { position: absolute; border-radius: 50%; pointer-events: none; }
    .orb-a { width:300px;height:300px;top:-10%;left:-15%; background:radial-gradient(circle,rgba(27,79,138,.3) 0%,transparent 70%); }
    .orb-b { width:200px;height:200px;top:5%;right:-12%; background:radial-gradient(circle,rgba(245,158,11,.12) 0%,transparent 70%); }

    .brand { position:relative;z-index:10; display:flex;align-items:center;gap:.75rem; padding:2rem 1.5rem 1.5rem; }
    .k-mark { width:44px;height:44px;border-radius:14px; background:linear-gradient(135deg,#1B4F8A,#0D3D6E); display:flex;align-items:center;justify-content:center; box-shadow:0 6px 20px rgba(27,79,138,.4); flex-shrink:0; }
    .brand-name { color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-.03em; }

    .card { position:relative;z-index:10;background:#fff;border-radius:2rem 2rem 0 0;padding:1.75rem 1.5rem 3rem;flex:1; }

    @media (min-width: 768px) {
      .page { flex-direction: row; align-items: stretch; }
      .brand { flex-direction: column; align-items: flex-start; justify-content: center; flex: 0 0 420px; padding: 3rem; gap: 1rem; }
      .k-mark { width: 56px; height: 56px; border-radius: 16px; }
      .brand-name { font-size: 2.25rem; }
      .brand-tagline { color: rgba(210,190,140,.7); font-size: .9375rem; margin: 0; }
      .card { border-radius: 0; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; min-height: 100svh; box-shadow: -32px 0 80px rgba(0,0,0,.15); overflow-y: auto; }
      .card-inner { width: 100%; max-width: 440px; }
    }
    @media (max-width: 767px) {
      .brand-tagline { display: none; }
      .card-inner { width: 100%; }
    }
    .card-title { font-size:1.25rem;font-weight:700;color:#0F2240;margin:0 0 .2rem; }
    .card-sub   { font-size:.875rem;color:#64748B;margin:0 0 1.5rem; }

    .label { display:block;font-size:.8125rem;font-weight:600;color:#334155;margin-bottom:.4rem;letter-spacing:.01em; }
    .label-opt { color:#94A3B8;font-weight:400; }
    .input {
      width:100%;padding:.8125rem 1rem;border:2px solid #E2E8F0;border-radius:12px;
      background:#F8FAFC;font-size:.9375rem;color:#0F172A;outline:none;font-family:inherit;
      transition:border-color .2s,box-shadow .2s;
    }
    .input:focus { border-color:#1B4F8A;background:#fff;box-shadow:0 0 0 4px rgba(27,79,138,.08); }
    .input.error { border-color:#DC2626; }
    .grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:.75rem; }

    .role-grid { display:grid;grid-template-columns:1fr 1fr;gap:.625rem; }
    .role-opt { display:flex;align-items:center;gap:.625rem;padding:.875rem;border:2px solid #E2E8F0;border-radius:14px;cursor:pointer;transition:all .2s; }
    .role-opt.selected { border-color:#1B4F8A;background:#E5EEF8; }
    .role-icon { font-size:1.25rem; }
    .role-label { font-size:.875rem;font-weight:600;color:#0F172A; }

    .pwd-wrap { position:relative; }
    .pwd-toggle { position:absolute;right:.875rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;color:#94A3B8;padding:.25rem; }

    .strength-bar { display:flex;gap:4px;margin-top:.5rem; }
    .strength-seg { flex:1;height:4px;border-radius:99px;background:#E2E8F0;transition:background .3s; }
    .strength-label { font-size:.75rem;margin-top:.25rem; }

    .btn {
      width:100%;padding:.9375rem;background:linear-gradient(135deg,#1B4F8A,#0D3D6E);
      color:#fff;font-size:.9375rem;font-weight:700;border:none;border-radius:14px;
      cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;
      min-height:52px;box-shadow:0 4px 20px rgba(27,79,138,.38);
      transition:opacity .2s,transform .15s;font-family:inherit;
    }
    .btn:hover:not(:disabled) { opacity:.92;transform:translateY(-1px); }
    .btn:disabled { opacity:.55;cursor:not-allowed; }
    .spinner { width:18px;height:18px;border:2.5px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    .err { font-size:.75rem;color:#DC2626;margin:.3rem 0 0; }
    .login-link { text-align:center;font-size:.875rem;color:#64748B;margin-top:1.25rem; }
    .login-link a { color:#1B4F8A;font-weight:700;text-decoration:none; }
    .login-link a:hover { text-decoration:underline; }
    .fields { display:flex;flex-direction:column;gap:1rem; }
  `],
  template: `
    <div class="page">
      <div class="orb orb-a orb-1"></div>
      <div class="orb orb-b orb-2"></div>

      <div class="brand animate-fade">
        <div class="k-mark">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M7 5v18M7 14l10-9M7 14l10 9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="brand-name">Katika</span>
        <p class="brand-tagline">Paiements sécurisés au Cameroun</p>
      </div>

      <div class="card animate-card">
        <div class="card-inner">
        <p class="card-title">Créer un compte</p>
        <p class="card-sub">Rejoignez Katika en quelques secondes.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="fields">

          <!-- Names -->
          <div class="grid-2">
            <div>
              <label class="label">Prénom</label>
              <input type="text" formControlName="firstName" placeholder="Jean"
                     class="input" [class.error]="isInvalid('firstName')" />
            </div>
            <div>
              <label class="label">Nom</label>
              <input type="text" formControlName="lastName" placeholder="Fotso"
                     class="input" [class.error]="isInvalid('lastName')" />
            </div>
          </div>

          <!-- Phone -->
          <div>
            <label class="label">Téléphone</label>
            <app-phone-input formControlName="phone" />
          </div>

          <!-- Email -->
          <div>
            <label class="label">Email <span class="label-opt">(optionnel)</span></label>
            <input type="email" formControlName="email" placeholder="jean@exemple.cm"
                   class="input" [class.error]="isInvalid('email')" />
          </div>

          <!-- Role -->
          <div>
            <label class="label">Je suis</label>
            <div class="role-grid">
              @for (role of roles; track role.value) {
                <label class="role-opt" [class.selected]="form.get('role')?.value === role.value">
                  <input type="radio" formControlName="role" [value]="role.value" style="display:none" />
                  <span class="role-icon">{{ role.icon }}</span>
                  <span class="role-label">{{ role.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="label">Mot de passe</label>
            <div class="pwd-wrap">
              <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
                     placeholder="••••••••" class="input" style="padding-right:3rem"
                     [class.error]="isInvalid('password')" />
              <button type="button" (click)="showPwd.set(!showPwd())" class="pwd-toggle">
                {{ showPwd() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (form.get('password')?.value) {
              <div class="strength-bar">
                @for (i of [1,2,3,4]; track i) {
                  <div class="strength-seg" [style.background]="i <= strengthScore() ? strengthColor() : '#E2E8F0'"></div>
                }
              </div>
              <p class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</p>
            }
          </div>

          <!-- Confirm password -->
          <div>
            <label class="label">Confirmer le mot de passe</label>
            <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
                   placeholder="••••••••" class="input"
                   [class.error]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched" />
            @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
              <p class="err">Les mots de passe ne correspondent pas</p>
            }
          </div>

          <!-- Submit -->
          <button type="submit" class="btn" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Inscription en cours…
            } @else {
              Créer mon compte
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            }
          </button>
        </form>

        <p class="login-link">
          Déjà un compte ? <a routerLink="/auth/login">Se connecter</a>
        </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(AuthService);
  private readonly toast   = inject(ToastService);
  private readonly router  = inject(Router);

  protected readonly showPwd  = signal(false);
  protected readonly loading  = signal(false);
  protected readonly roles    = [
    { value: 'BUYER',  icon: '🛒', label: 'Acheteur' },
    { value: 'SELLER', icon: '🏪', label: 'Vendeur'  },
  ];

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

  protected strengthScore  = computed(() => passwordStrength(this.form.get('password')?.value ?? ''));
  protected strengthColor  = computed(() => ['#EF4444','#EF4444','#F59E0B','#3A7BC8','#10B981'][this.strengthScore()]);
  protected strengthLabel  = computed(() => ['','Très faible','Faible','Bon','Excellent'][this.strengthScore()]);

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.svc.register({
      firstName: v.firstName!, lastName: v.lastName!,
      phone: v.phone!, email: v.email || undefined,
      password: v.password!, role: v.role as 'BUYER' | 'SELLER',
    }).subscribe({
      next: () => { this.toast.success('Compte créé ! Connectez-vous.'); this.router.navigate(['/auth/login']); },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
