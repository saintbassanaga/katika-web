import { Component, inject, signal, ViewChild } from '@angular/core';
import { AuthStore } from '../../../core/auth/auth.store';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mfa-verify',
  standalone: true,
  imports: [OtpInputComponent, RouterLink, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div class="max-w-sm w-full mx-auto">

        <div class="text-center mb-8">
          <div class="text-5xl mb-4">🔐</div>
          <h1 class="text-2xl font-bold text-gray-900">Vérification à deux facteurs</h1>
          <p class="text-sm text-gray-500 mt-2">
            Entrez le code à 6 chiffres de votre application d'authentification
          </p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm p-6">

          @if (!useBackupCode()) {
            <app-otp-input
              #otpInput
              [length]="6"
              (completed)="onCodeCompleted($event)"
              [(value)]="otpValue"
            />
          } @else {
            <input
              type="text"
              [(ngModel)]="backupValue"
              placeholder="XXXX-XXXX"
              maxlength="9"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                     text-center font-mono text-lg tracking-wider
                     focus:border-blue-600 focus:outline-none transition-colors"
            />
          }

          @if (error()) {
            <p class="text-center text-sm text-red-600 mt-3">{{ error() }}</p>
          }

          @if (!useBackupCode()) {
            <button
              type="button"
              (click)="useBackupCode.set(true)"
              class="w-full text-center text-sm text-blue-600 mt-4 hover:underline"
            >
              Utiliser un code de secours
            </button>
          } @else {
            <button
              type="button"
              (click)="submit()"
              [disabled]="auth.loading() || backupValue.length < 8"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
                     text-sm hover:bg-blue-700 transition-colors min-h-[44px]
                     disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              @if (auth.loading()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              }
              Vérifier
            </button>
            <button
              type="button"
              (click)="useBackupCode.set(false)"
              class="w-full text-center text-sm text-blue-600 mt-3 hover:underline"
            >
              Utiliser un code TOTP
            </button>
          }
        </div>

        <a routerLink="/auth/login" class="block text-center text-sm text-gray-500 mt-6 hover:underline">
          ← Retour à la connexion
        </a>
      </div>
    </div>
  `,
})
export class MfaVerifyComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly useBackupCode = signal(false);
  protected readonly error = signal('');
  protected otpValue = '';
  protected backupValue = '';

  @ViewChild('otpInput') otpInput?: OtpInputComponent;

  protected onCodeCompleted(code: string): void {
    this.submit(code);
  }

  protected submit(code?: string): void {
    if (this.useBackupCode()) {
      if (!this.backupValue) return;
      this.error.set('');
      this.auth.verifyMfa({ code: '', backupCode: this.backupValue });
    } else {
      const finalCode = code ?? this.otpValue;
      if (!finalCode) return;
      this.error.set('');
      this.auth.verifyMfa({ code: finalCode });
    }
  }
}
