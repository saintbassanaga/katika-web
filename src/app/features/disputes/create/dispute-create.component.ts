import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DisputeService } from '../dispute.service';
import { ToastService } from '../../../core/notification/toast.service';
import { TranslatePipe } from '@ngx-translate/core';

const REASONS = [
  { value: 'ITEM_NOT_RECEIVED',    labelKey: 'disputes.reasons.ITEM_NOT_RECEIVED',    icon: '📦' },
  { value: 'ITEM_NOT_AS_DESCRIBED',labelKey: 'disputes.reasons.ITEM_NOT_AS_DESCRIBED', icon: '🔍' },
  { value: 'SELLER_NOT_RESPONDING',labelKey: 'disputes.reasons.SELLER_NOT_RESPONDING', icon: '📵' },
  { value: 'OTHER',                labelKey: 'disputes.reasons.OTHER',                 icon: '💬' },
];

@Component({
  selector: 'app-dispute-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto">
      <a routerLink="/disputes" class="flex items-center gap-2 text-sm text-gray-500 mb-4">← {{ 'common.back' | translate }}</a>
      <h1 class="text-xl font-bold text-gray-900 mb-6">{{ 'disputes.create.pageTitle' | translate }}</h1>

      <!-- Step indicator -->
      <div class="flex gap-2 mb-6">
        @for (s of [1,2,3]; track s) {
          <div class="flex-1 h-1.5 rounded-full"
               [class.bg-blue-600]="step() >= s"
               [class.bg-gray-200]="step() < s"></div>
        }
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        @if (step() === 1) {
          <div class="space-y-4">
            <h2 class="text-base font-semibold">{{ 'disputes.create.reasonTitle' | translate }}</h2>
            <div class="space-y-2">
              @for (reason of reasons; track reason.value) {
                <label
                  class="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors"
                  [class.border-blue-600]="form.get('reason')?.value === reason.value"
                  [class.bg-blue-50]="form.get('reason')?.value === reason.value"
                  [class.border-gray-200]="form.get('reason')?.value !== reason.value"
                >
                  <input type="radio" formControlName="reason" [value]="reason.value" class="sr-only" />
                  <span class="text-2xl">{{ reason.icon }}</span>
                  <span class="font-medium text-sm">{{ reason.labelKey | translate }}</span>
                </label>
              }
            </div>
            <button type="button" (click)="step.set(2)" [disabled]="!form.get('reason')?.value"
                    class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                           hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px]">
              {{ 'disputes.create.continue' | translate }}
            </button>
          </div>
        }

        @if (step() === 2) {
          <div class="space-y-4">
            <h2 class="text-base font-semibold">{{ 'disputes.create.descTitle' | translate }}</h2>
            <div>
              <textarea
                formControlName="description"
                rows="5"
                [placeholder]="'disputes.create.descPh' | translate"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                       focus:border-blue-600 focus:outline-none resize-none transition-colors"
                [class.border-red-400]="form.get('description')?.invalid && form.get('description')?.touched"
              ></textarea>
              <p class="text-xs text-gray-400 mt-1 text-right">
                {{ form.get('description')?.value?.length ?? 0 }}/1000
              </p>
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="step.set(1)"
                      class="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                ← {{ 'disputes.create.back' | translate }}
              </button>
              <button type="button" (click)="step.set(3)"
                      [disabled]="form.get('description')?.invalid"
                      class="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold
                             hover:bg-blue-700 disabled:opacity-50">
                {{ 'disputes.create.continue' | translate }}
              </button>
            </div>
          </div>
        }

        @if (step() === 3) {
          <div class="space-y-4">
            <h2 class="text-base font-semibold">{{ 'disputes.create.summaryTitle' | translate }}</h2>
            <div class="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <p class="text-xs text-gray-500">{{ 'disputes.create.transactionLabel' | translate }}</p>
                <p class="text-sm font-medium">{{ transactionId() }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">{{ 'disputes.create.motifLabel' | translate }}</p>
                <p class="text-sm font-medium">{{ selectedReasonLabel() | translate }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">{{ 'disputes.create.descTitle' | translate }}</p>
                <p class="text-sm text-gray-700">{{ form.get('description')?.value }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="step.set(2)"
                      class="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                ← {{ 'disputes.create.modify' | translate }}
              </button>
              <button type="submit" [disabled]="loading() || form.invalid"
                      class="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold
                             hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                @if (loading()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                }
                {{ loading() ? ('disputes.create.submitting' | translate) : ('disputes.create.submit' | translate) }}
              </button>
            </div>
          </div>
        }
      </form>
    </div>
  `,
})
export class DisputeCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal(1);
  protected readonly loading = signal(false);
  protected readonly transactionId = signal('');
  protected readonly reasons = REASONS;

  protected readonly form = this.fb.group({
    reason: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    const txId = this.route.snapshot.queryParamMap.get('transactionId') ?? '';
    this.transactionId.set(txId);
  }

  protected selectedReasonLabel(): string {
    const val = this.form.get('reason')?.value;
    return REASONS.find(r => r.value === val)?.labelKey ?? '';
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.disputeService.createDispute({
      transactionId: this.transactionId(),
      reason: this.form.value.reason as any,
      description: this.form.value.description!,
    }).subscribe({
      next: (dispute: any) => {
        this.toast.success('Litige ouvert avec succès');
        this.router.navigate(['/disputes', dispute.id]);
      },
      error: () => this.loading.set(false),
    });
  }
}
