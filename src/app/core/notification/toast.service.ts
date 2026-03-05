import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '@shared/models/model';

export type { Toast, ToastType };

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string) { this.push('success', message); }
  error(message: string)   { this.push('error',   message); }
  warning(message: string) { this.push('warning',  message); }
  info(message: string)    { this.push('info',     message); }

  dismiss(id: string): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  private push(type: ToastType, message: string): void {
    const id = crypto.randomUUID();
    this.toasts.update(ts => [...ts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
