import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div class="max-w-sm w-full mx-auto">

        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold" style="color:#1A56DB">Katika</h1>
          <p class="text-gray-500 text-sm mt-1">Paiements sécurisés au Cameroun</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p class="text-sm text-gray-500 mb-6">Bienvenue ! Entrez vos identifiants.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Numéro de téléphone
              </label>
              <app-phone-input formControlName="username" />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-xs text-red-600 mt-1">Numéro de téléphone requis</p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                         focus:border-blue-600 focus:outline-none transition-colors pr-10"
                  [class.border-red-400]="form.get('password')?.invalid && form.get('password')?.touched"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                         hover:text-gray-600 transition-colors"
                  [attr.aria-label]="showPassword() ? 'Masquer' : 'Afficher'"
                >
                  {{ showPassword() ? '🙈' : '👁' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs text-red-600 mt-1">Mot de passe requis</p>
              }
            </div>

            <!-- Forgot password -->
            <div class="text-right">
              <a href="#" class="text-sm text-blue-600 hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              [disabled]="form.invalid || auth.loading()"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
                     text-sm hover:bg-blue-700 transition-colors min-h-[44px]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
            >
              @if (auth.loading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>
        </div>

        <!-- Register link -->
        <p class="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?
          <a routerLink="/auth/register" class="text-blue-600 font-medium hover:underline">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly showPassword = signal(false);

  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.auth.login({
      username: this.form.value.username!,
      password: this.form.value.password!,
    });
  }
}
