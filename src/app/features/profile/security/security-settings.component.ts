import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthService } from '../../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/notification/toast.service';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <a routerLink="/profile" class="flex items-center gap-2 text-sm text-gray-500 mb-4">← Profil</a>
      <h1 class="text-xl font-bold text-gray-900 mb-6">Sécurité</h1>

      <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        <!-- MFA status -->
        <div class="px-5 py-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">Authentification à deux facteurs</p>
              <p class="text-xs mt-0.5" [class.text-green-600]="auth.hasMfa()" [class.text-gray-400]="!auth.hasMfa()">
                {{ auth.hasMfa() ? '✓ Activée' : 'Non activée' }}
              </p>
            </div>
            @if (auth.hasMfa()) {
              <button
                (click)="disableMfa()"
                class="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Désactiver
              </button>
            } @else {
              <a
                routerLink="/profile/security/mfa"
                class="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
              >
                Activer
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SecuritySettingsComponent {
  protected readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected async disableMfa(): Promise<void> {
    const code = prompt('Entrez votre code TOTP pour désactiver la 2FA:');
    if (!code) return;
    try {
      await firstValueFrom(this.authService.disableMfa(code));
      this.toast.success('2FA désactivée');
    } catch {}
  }
}
