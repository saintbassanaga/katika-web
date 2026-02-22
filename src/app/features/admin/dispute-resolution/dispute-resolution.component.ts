import { Component, inject, input, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/notification/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

const RESOLUTIONS = [
  { value: 'FULL_REFUND_BUYER',     label: 'Remboursement total à l\'acheteur' },
  { value: 'RELEASE_TO_SELLER',     label: 'Libérer au vendeur'                },
  { value: 'PARTIAL_REFUND_BUYER',  label: 'Remboursement partiel à l\'acheteur' },
  { value: 'SPLIT_50_50',           label: 'Partage 50/50'                     },
  { value: 'NO_ACTION',             label: 'Aucune action'                     },
];

@Component({
  selector: 'app-dispute-resolution',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <a routerLink="/admin" class="flex items-center gap-2 text-sm text-gray-500 mb-4">← Administration</a>
      <h1 class="text-xl font-bold text-gray-900 mb-6">Résolution de litige</h1>

      @if (id()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

          <!-- Resolution picker -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Décision</label>
            <div class="space-y-2">
              @for (res of resolutions; track res.value) {
                <label
                  class="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors"
                  [class.border-blue-600]="form.get('resolution')?.value === res.value"
                  [class.bg-blue-50]="form.get('resolution')?.value === res.value"
                  [class.border-gray-200]="form.get('resolution')?.value !== res.value"
                >
                  <input type="radio" formControlName="resolution" [value]="res.value" class="sr-only" />
                  <span class="text-sm font-medium">{{ res.label }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
            <textarea
              formControlName="notes"
              rows="4"
              placeholder="Notes visibles par le support uniquement..."
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                     focus:border-blue-600 focus:outline-none resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                   hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            Appliquer la résolution
          </button>
        </form>
      } @else {
        <p class="text-gray-500 text-sm">Sélectionnez un litige dans la liste.</p>
      }
    </div>
  `,
})
export class DisputeResolutionComponent implements OnInit {
  readonly id = input<string>('');

  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly resolutions = RESOLUTIONS;

  protected readonly form = this.fb.group({
    resolution: ['', Validators.required],
    notes: ['', Validators.required],
    claimedAmount: [null as number | null],
  });

  ngOnInit(): void {}

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.http.post(
      `${environment.apiUrl}/disputes/${this.id()}/resolve`,
      this.form.value,
      { withCredentials: true },
    ).subscribe({
      next: () => {
        this.toast.success('Résolution appliquée avec succès');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
