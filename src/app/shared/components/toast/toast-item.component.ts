import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Toast } from '@core/notification/toast.service';

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error:   'bg-red-50   border-red-500   text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info:    'bg-blue-50  border-blue-500  text-blue-800',
};

@Component({
  selector: 'app-toast-item',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg animate-slide-in"
         [class]="toastStyles()"
         role="alert">

      <!-- SVG icon -->
      <span class="shrink-0 mt-0.5 w-4 h-4">
        @switch (toast().type) {
          @case ('success') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
          @case ('error') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          }
          @case ('warning') {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          @default {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        }
      </span>

      <p class="flex-1 text-sm font-medium leading-snug">{{ toast().message }}</p>

      <button (click)="dismiss.emit()"
              class="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1 cursor-pointer bg-transparent border-none p-0 flex items-center text-current"
              [attr.aria-label]="'common.close' | translate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `,
})
export class ToastItemComponent {
  readonly toast   = input.required<Toast>();
  readonly dismiss = output<void>();

  protected toastStyles(): string {
    return TOAST_STYLES[this.toast().type] ?? TOAST_STYLES['info'];
  }
}
