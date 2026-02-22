import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [RouterLink, AvatarComponent],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <h1 class="text-xl font-bold text-gray-900 mb-6">Mon profil</h1>

      <!-- User info card -->
      <div class="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div class="flex items-center gap-4">
          <app-avatar [name]="auth.fullName()" size="lg" />
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ auth.fullName() }}</h2>
            <p class="text-sm text-gray-500">{{ auth.role() }}</p>
          </div>
        </div>
      </div>

      <!-- Menu items -->
      <div class="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
        <a routerLink="/profile/security"
           class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
          <span class="text-xl">🔐</span>
          <span class="flex-1 text-sm font-medium">Sécurité du compte</span>
          <span class="text-gray-400">›</span>
        </a>
        <a routerLink="/wallet"
           class="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
          <span class="text-xl">💳</span>
          <span class="flex-1 text-sm font-medium">Portefeuille</span>
          <span class="text-gray-400">›</span>
        </a>
      </div>

      <!-- Logout -->
      <button
        (click)="auth.logout()"
        class="w-full mt-4 py-3 border border-red-200 text-red-600 rounded-xl
               font-medium text-sm hover:bg-red-50 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  `,
})
export class ProfileHomeComponent {
  protected readonly auth = inject(AuthStore);
}
