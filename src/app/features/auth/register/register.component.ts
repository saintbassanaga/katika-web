
import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notification/toast.service';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div class="max-w-sm w-full mx-auto">

        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold" style="color:#1A56DB">Katika</h1>
          <p class="text-gray-500 text-sm mt-1">Créez votre compte</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-6">Inscription</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- First name + Last name -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1.5">Prénom</label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="Jean"
                  class="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm
                         focus:border-blue-600 focus:outline-none transition-colors"
                  [class.border-red-400]="isInvalid('firstName')"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Fotso"
                  class="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm
                         focus:border-blue-600 focus:outline-none transition-colors"
                  [class.border-red-400]="isInvalid('lastName')"
                />
              </div>
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <app-phone-input formControlName="phone" />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span class="text-gray-400">(optionnel)</span>
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="jean@exemple.cm"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                       focus:border-blue-600 focus:outline-none transition-colors"
                [class.border-red-400]="isInvalid('email')"
              />
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Je suis</label>
              <div class="grid grid-cols-2 gap-2">
                @for (role of roles; track role.value) {
                  <label
                    class="flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors"
                    [class.border-blue-600]="form.get('role')?.value === role.value"
                    [class.bg-blue-50]="form.get('role')?.value === role.value"
                    [class.border-gray-200]="form.get('role')?.value !== role.value"
                  >
                    <input type="radio" formControlName="role" [value]="role.value" class="sr-only" />
                    <span class="text-lg">{{ role.icon }}</span>
                    <span class="text-sm font-medium">{{ role.label }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div class="relative">
                <input
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                         focus:border-blue-600 focus:outline-none transition-colors pr-10"
                  [class.border-red-400]="isInvalid('password')"
                />
                <button type="button" (click)="showPwd.set(!showPwd())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {{ showPwd() ? '🙈' : '👁' }}
                </button>
              </div>
              <!-- Strength meter -->
              @if (form.get('password')?.value) {
                <div class="flex gap-1 mt-2">
                  @for (i of [1,2,3,4]; track i) {
                    <div
                      class="h-1.5 flex-1 rounded-full transition-colors"
                      [class]="i <= passwordStrengthScore() ? strengthColor() : 'bg-gray-200'"
                    ></div>
                  }
                </div>
                <p class="text-xs mt-1" [class]="strengthTextColor()">{{ strengthLabel() }}</p>
              }
            </div>

            <!-- Confirm password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmer le mot de passe</label>
              <input
                [type]="showPwd() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="••••••••"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                       focus:border-blue-600 focus:outline-none transition-colors"
                [class.border-red-400]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched"
              />
              @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
                <p class="text-xs text-red-600 mt-1">Les mots de passe ne correspondent pas</p>
              }
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
                     text-sm hover:bg-blue-700 transition-colors min-h-[44px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 mt-2"
            >
              @if (loading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Inscription en cours...
              } @else {
                Créer mon compte
              }
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?
          <a routerLink="/auth/login" class="text-blue-600 font-medium hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly showPwd = signal(false);
  protected readonly loading = signal(false);

  protected readonly roles = [
    { value: 'BUYER',  icon: '🛒', label: 'Acheteur' },
    { value: 'SELLER', icon: '🏪', label: 'Vendeur'  },
  ];

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    phone:     ['', Validators.required],
    email:     ['', Validators.email],
    role:      ['BUYER', Validators.required],
    password:  ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  protected isInvalid(field: string) {
    const c = this.form.get(field);
    return c?.invalid && c?.touched;
  }

  protected passwordStrengthScore = computed(() =>
    passwordStrength(this.form.get('password')?.value ?? '')
  );

  protected strengthColor = computed(() => {
    const s = this.passwordStrengthScore();
    if (s <= 1) return 'bg-red-500';
    if (s === 2) return 'bg-yellow-500';
    if (s === 3) return 'bg-blue-500';
    return 'bg-green-500';
  });

  protected strengthTextColor = computed(() => {
    const s = this.passwordStrengthScore();
    if (s <= 1) return 'text-red-600';
    if (s === 2) return 'text-yellow-600';
    if (s === 3) return 'text-blue-600';
    return 'text-green-600';
  });

  protected strengthLabel = computed(() => {
    const s = this.passwordStrengthScore();
    if (s <= 1) return 'Très faible';
    if (s === 2) return 'Faible';
    if (s === 3) return 'Bon';
    return 'Excellent';
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    this.authService.register({
      firstName: v.firstName!,
      lastName:  v.lastName!,
      phone:     v.phone!,
      email:     v.email || undefined,
      password:  v.password!,
      role:      v.role as 'BUYER' | 'SELLER',
    }).subscribe({
      next: () => {
        this.toast.success('Compte créé avec succès ! Connectez-vous.');
        this.router.navigate(['/auth/login']);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }
}
