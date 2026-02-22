import { Component, inject, signal, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/notification/toast.service';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [OtpInputComponent],
  template: `
    <div class="min-h-screen bg-gray-50 px-4 py-8">
      <div class="max-w-sm mx-auto">
        <h1 class="text-xl font-bold text-gray-900 mb-6">Activer la 2FA</h1>

        @if (step() === 1) {
          <!-- Step 1: Display QR -->
          <div class="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div class="text-center">
              <p class="text-sm text-gray-600 mb-4">
                1. Scannez ce QR code avec votre application d'authentification
              </p>
              @if (qrUri()) {
                <img [src]="qrUri()" alt="QR Code MFA" class="mx-auto w-52 h-52 rounded-xl" />
              } @else {
                <div class="w-52 h-52 bg-gray-100 rounded-xl animate-pulse mx-auto"></div>
              }
            </div>

            @if (backupCodes().length) {
              <div>
                <p class="text-sm font-medium text-gray-700 mb-3">
                  2. Sauvegardez vos codes de secours
                </p>
                <div class="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3">
                  @for (code of backupCodes(); track code) {
                    <code class="text-xs font-mono text-center bg-white rounded-lg py-2 px-1 border border-gray-200">
                      {{ code }}
                    </code>
                  }
                </div>
                <button
                  (click)="copyBackupCodes()"
                  class="w-full mt-3 py-2 border border-gray-200 rounded-xl text-sm
                         text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  📋 Copier tous les codes
                </button>
              </div>
            }

            <button
              (click)="step.set(2)"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
                     text-sm hover:bg-blue-700 transition-colors min-h-[44px]"
            >
              J'ai scanné le QR code →
            </button>
          </div>
        }

        @if (step() === 2) {
          <!-- Step 2: Confirm OTP -->
          <div class="bg-white rounded-2xl shadow-sm p-6">
            <p class="text-sm text-gray-600 text-center mb-6">
              Entrez le code à 6 chiffres affiché dans votre application
            </p>

            <app-otp-input (completed)="confirmMfa($event)" [(value)]="otpValue" />

            @if (loading()) {
              <div class="text-center mt-4">
                <span class="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            }

            <button
              type="button"
              (click)="step.set(1)"
              class="w-full text-center text-sm text-gray-500 mt-4 hover:underline"
            >
              ← Retour
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class MfaSetupComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly step = signal(1);
  protected readonly qrUri = signal('');
  protected readonly backupCodes = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected otpValue = '';

  async ngOnInit(): Promise<void> {
    try {
      const setup = await firstValueFrom(this.authService.getMfaSetup());
      this.qrUri.set(setup.qrCodeUri);
      this.backupCodes.set(setup.backupCodes);
    } catch {
      this.toast.error('Impossible de charger la configuration 2FA.');
    }
  }

  protected copyBackupCodes(): void {
    navigator.clipboard.writeText(this.backupCodes().join('\n'));
    this.toast.success('Codes copiés !');
  }

  protected async confirmMfa(code: string): Promise<void> {
    this.loading.set(true);
    try {
      await firstValueFrom(this.authService.confirmMfa(code));
      this.toast.success('Authentification à deux facteurs activée');
      this.router.navigate(['/profile/security']);
    } catch {
      this.loading.set(false);
    }
  }
}
