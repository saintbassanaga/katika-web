import { inject, Injectable, signal } from '@angular/core';
import { TuiAlertService } from '@taiga-ui/core';
import { Toast, ToastType } from '@shared/models/model';

export type { Toast, ToastType };

/** Maps internal toast types to TaigaUI appearance tokens */
const APPEARANCE_MAP: Record<ToastType, string> = {
  success: 'positive',
  error:   'negative',
  warning: 'warning',
  info:    'info',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly tuiAlerts = inject(TuiAlertService);

  /** Kept for backward compatibility (read-only; TuiAlertService owns display) */
  readonly toasts = signal<Toast[]>([]);

  success(message: string) { this.push('success', message); }
  error(message: string)   { this.push('error',   message); }
  warning(message: string) { this.push('warning',  message); }
  info(message: string)    { this.push('info',     message); }

  dismiss(_id: string): void {
    // Dismissal is handled automatically by TuiAlertService via autoClose
  }

  private push(type: ToastType, message: string): void {
    this.tuiAlerts.open(message, {
      appearance: APPEARANCE_MAP[type],
      autoClose: 4000,
    }).subscribe();
  }
}
