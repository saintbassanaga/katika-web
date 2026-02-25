import { Component, input, output } from '@angular/core';
import { Toast } from '@core/notification/toast.service';

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error:   'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info:    'bg-blue-50 border-blue-500 text-blue-800',
};

const TOAST_ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

@Component({
  selector: 'app-toast-item',
  standalone: true,
  template: `
    <div
      class="flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg animate-slide-in"
      [class]="toastStyles()"
      role="alert"
    >
      <span class="text-lg leading-none mt-0.5">{{ toastIcon() }}</span>
      <p class="flex-1 text-sm font-medium">{{ toast().message }}</p>
      <button
        (click)="dismiss.emit()"
        class="text-current opacity-60 hover:opacity-100 transition-opacity ml-1 text-lg leading-none"
        aria-label="Fermer"
      >×</button>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 200ms ease-out;
    }
  `],
})
export class ToastItemComponent {
  readonly toast = input.required<Toast>();
  readonly dismiss = output<void>();

  protected toastStyles() {
    return TOAST_STYLES[this.toast().type];
  }

  protected toastIcon() {
    return TOAST_ICONS[this.toast().type];
  }
}
