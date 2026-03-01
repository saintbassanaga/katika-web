import { Component, inject } from '@angular/core';
import { ToastService } from '@core/notification/toast.service';
import { ToastItemComponent } from './toast-item.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ToastItemComponent],
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <app-toast-item [toast]="toast" (dismiss)="toastService.dismiss(toast.id)" />
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
