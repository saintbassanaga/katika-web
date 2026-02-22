import { Component, input, output } from '@angular/core';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit($event)"
      class="inline-flex items-center justify-center gap-2 font-semibold
             rounded-xl transition-all min-h-[44px] focus-visible:ring-2
             focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      [class]="variantClasses() + ' ' + sizeClasses()"
    >
      @if (loading()) {
        <span class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly clicked = output<MouseEvent>();

  protected variantClasses() {
    const map: Record<ButtonVariant, string> = {
      primary:   'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      ghost:     'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50',
      danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400',
    };
    return map[this.variant()];
  }

  protected sizeClasses() {
    const map: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    return map[this.size()];
  }
}
