import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div class="text-6xl mb-4">{{ icon() }}</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title() }}</h3>
      <p class="text-sm text-gray-500 mb-6 max-w-xs">{{ message() }}</p>
      @if (ctaLabel()) {
        <button
          (click)="ctaClick.emit()"
          class="px-6 py-3 bg-primary text-white rounded-xl font-medium
                 text-sm hover:bg-primary-dark transition-colors min-h-[44px]"
          style="background:#1B4F8A"
        >
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input<string>('Aucun élément');
  readonly message = input<string>('Il n\'y a rien à afficher pour le moment.');
  readonly ctaLabel = input<string>('');
  readonly ctaClick = output<void>();
}
