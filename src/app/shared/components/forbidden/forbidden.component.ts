import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div class="text-8xl font-bold text-gray-200 mb-4">403</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ 'errors.forbidden.title' | translate }}</h1>
      <p class="text-gray-500 mb-8">{{ 'errors.forbidden.message' | translate }}</p>
      <a
        routerLink="/dashboard"
        class="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold
               hover:bg-blue-700 transition-colors"
      >
        {{ 'errors.forbidden.back' | translate }}
      </a>
    </div>
  `,
})
export class ForbiddenComponent {}
