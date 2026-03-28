import { Component, input, output } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Toast } from '@app/models';

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error:   'bg-red-50   border-red-500   text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info:    'bg-blue-50  border-blue-500  text-blue-800',
};

@Component({
  selector: 'app-toast-item',
  standalone: true,
  imports: [TuiIcon, TranslatePipe],
  template: `
    <div class="flex items-start gap-3 p-4 rounded-xl border-l-4 shadow-lg animate-slide-in"
         [class]="toastStyles()"
         role="alert">

      <tui-icon [icon]="toastIcon()" class="shrink-0 mt-0.5 w-4 h-4" />

      <p class="flex-1 text-sm font-medium leading-snug">{{ toast().message }}</p>

      <button (click)="dismiss.emit()"
              class="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1 cursor-pointer bg-transparent border-none p-0 flex items-center text-current"
              [attr.aria-label]="'common.close' | translate">
        <tui-icon icon="@tui.x" class="w-4 h-4" />
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

  protected toastIcon(): string {
    const map: Record<string, string> = {
      success: '@tui.check',
      error:   '@tui.x',
      warning: '@tui.triangle-alert',
      info:    '@tui.info',
    };
    return map[this.toast().type] ?? '@tui.info';
  }
}
