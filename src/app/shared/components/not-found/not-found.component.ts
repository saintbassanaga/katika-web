import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div class="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
      <p class="text-gray-500 mb-8">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <a
        routerLink="/dashboard"
        class="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold
               hover:bg-blue-700 transition-colors"
      >
        Retour à l'accueil
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
