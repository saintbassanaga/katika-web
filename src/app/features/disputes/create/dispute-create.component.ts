import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DisputeService, DisputeReason } from '../dispute.service';
import { EscrowService } from '@features/escrow/escrow.service';
import { ToastService } from '@core/notification/toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ReasonGroup } from '@shared/models/model';
import { AuthStore } from '@core/auth/auth.store';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TransactionDetail } from '@app/models';

const MAX_FILES      = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES  = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf', 'text/plain',
]);

interface SelectedFile {
  file: File;
  evidenceType: string;
  error?: string;
}

const REASON_GROUPS: ReasonGroup[] = [
  {
    groupKey: 'disputes.categories.delivery',
    reasons: [
      { value: 'NOT_RECEIVED',     labelKey: 'disputes.reasons.NOT_RECEIVED',     icon: '📦' },
      { value: 'LATE_DELIVERY',    labelKey: 'disputes.reasons.LATE_DELIVERY',    icon: '⏰' },
      { value: 'PARTIAL_DELIVERY', labelKey: 'disputes.reasons.PARTIAL_DELIVERY', icon: '🧩' },
      { value: 'WRONG_ADDRESS',    labelKey: 'disputes.reasons.WRONG_ADDRESS',    icon: '📍' },
    ],
  },
  {
    groupKey: 'disputes.categories.quality',
    reasons: [
      { value: 'NOT_AS_DESCRIBED', labelKey: 'disputes.reasons.NOT_AS_DESCRIBED', icon: '🔍' },
      { value: 'DEFECTIVE',        labelKey: 'disputes.reasons.DEFECTIVE',        icon: '🔧' },
      { value: 'WRONG_ITEM',       labelKey: 'disputes.reasons.WRONG_ITEM',       icon: '🔄' },
      { value: 'COUNTERFEIT',      labelKey: 'disputes.reasons.COUNTERFEIT',      icon: '⚠️' },
      { value: 'QUALITY_ISSUE',    labelKey: 'disputes.reasons.QUALITY_ISSUE',    icon: '👎' },
    ],
  },
  {
    groupKey: 'disputes.categories.service',
    reasons: [
      { value: 'SERVICE_NOT_RENDERED',   labelKey: 'disputes.reasons.SERVICE_NOT_RENDERED',   icon: '🚫' },
      { value: 'SERVICE_INCOMPLETE',     labelKey: 'disputes.reasons.SERVICE_INCOMPLETE',     icon: '⏳' },
      { value: 'SERVICE_UNSATISFACTORY', labelKey: 'disputes.reasons.SERVICE_UNSATISFACTORY', icon: '😞' },
    ],
  },
  {
    groupKey: 'disputes.categories.communication',
    reasons: [
      { value: 'SELLER_UNRESPONSIVE', labelKey: 'disputes.reasons.SELLER_UNRESPONSIVE', icon: '📵' },
      { value: 'BUYER_UNRESPONSIVE',  labelKey: 'disputes.reasons.BUYER_UNRESPONSIVE',  icon: '📵' },
    ],
  },
  {
    groupKey: 'disputes.categories.financial',
    reasons: [
      { value: 'OVERCHARGED', labelKey: 'disputes.reasons.OVERCHARGED', icon: '💰' },
      { value: 'HIDDEN_FEES', labelKey: 'disputes.reasons.HIDDEN_FEES', icon: '💳' },
    ],
  },
  {
    groupKey: 'disputes.categories.fraud',
    reasons: [
      { value: 'SUSPECTED_FRAUD',          labelKey: 'disputes.reasons.SUSPECTED_FRAUD',          icon: '🚨' },
      { value: 'UNAUTHORIZED_TRANSACTION', labelKey: 'disputes.reasons.UNAUTHORIZED_TRANSACTION', icon: '🔒' },
    ],
  },
  {
    groupKey: 'disputes.categories.other',
    reasons: [{ value: 'OTHER', labelKey: 'disputes.reasons.OTHER', icon: '💬' }],
  },
];

@Component({
  selector: 'app-dispute-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, AmountPipe],
  template: `
    <div class="px-4 py-6 max-w-lg mx-auto pb-24">

      <!-- Back -->
      <a routerLink="/disputes"
         class="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-70 transition-opacity"
         style="color: var(--clr-muted)">
        ← {{ 'common.back' | translate }}
      </a>

      <h1 class="text-xl font-bold mb-4" style="color: var(--clr-text)">
        {{ 'disputes.create.pageTitle' | translate }}
      </h1>

      <!-- ── Inline progress stepper ──────────────── -->
      <div class="flex items-center mb-6">
        @for (label of stepLabels; track label; let i = $index; let last = $last) {
          <div class="flex flex-col items-center shrink-0">
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                 [style.background]="step() > i + 1 ? 'var(--clr-primary)' : step() === i + 1 ? 'var(--clr-primary)' : 'transparent'"
                 [style.border-color]="step() >= i + 1 ? 'var(--clr-primary)' : 'var(--clr-border)'"
                 [style.color]="step() >= i + 1 ? '#fff' : 'var(--clr-muted)'">
              @if (step() > i + 1) { ✓ } @else { {{ i + 1 }} }
            </div>
            <p class="text-[10px] mt-1 text-center font-medium w-16 leading-tight"
               style="color: var(--clr-muted)">{{ label | translate }}</p>
          </div>
          @if (!last) {
            <div class="flex-1 h-0.5 mx-1 mb-4 transition-colors"
                 [style.background]="step() > i + 1 ? 'var(--clr-primary)' : 'var(--clr-border)'">
            </div>
          }
        }
      </div>

      <!-- ── Transaction card (always visible) ─────── -->
      @if (txLoading()) {
        <div class="h-16 bg-gray-100 rounded-2xl animate-pulse mb-4"></div>
      } @else if (transaction()) {
        <div class="flex items-center justify-between px-4 py-3 rounded-2xl mb-4 border"
             style="background: var(--clr-primary-lt, #EBF4FF); border-color: var(--clr-primary)">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
               style="color: var(--clr-primary)">
              {{ 'disputes.create.txCard' | translate }}
            </p>
            <p class="text-sm font-bold" style="color: var(--clr-text)">{{ transaction()!.reference }}</p>
          </div>
          <p class="text-base font-bold" style="color: var(--clr-primary)">
            {{ transaction()!.grossAmount | amount }}
          </p>
        </div>
      }

      <!-- ── Form ──────────────────────────────────── -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()">

        <!-- Step 1 — Reason -->
        @if (step() === 1) {
          <div class="space-y-4">
            <h2 class="text-base font-semibold" style="color: var(--clr-text)">
              {{ 'disputes.create.reasonTitle' | translate }}
            </h2>

            <div class="space-y-4">
              @for (group of reasonGroups; track group.groupKey) {
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide mb-2 px-1"
                     style="color: var(--clr-muted)">
                    {{ group.groupKey | translate }}
                  </p>
                  <div class="space-y-1.5">
                    @for (reason of group.reasons; track reason.value) {
                      <label
                        class="flex items-center gap-3 px-4 py-3 border-2 rounded-xl cursor-pointer transition-colors"
                        [style.border-color]="form.get('reason')?.value === reason.value ? 'var(--clr-primary)' : 'var(--clr-border)'"
                        [style.background]="form.get('reason')?.value === reason.value ? 'var(--clr-primary-lt, #EBF4FF)' : '#F8FAFC'"
                      >
                        <input type="radio" formControlName="reason" [value]="reason.value" class="sr-only"
                               (change)="step.set(2)" />
                        <span class="text-xl leading-none">{{ reason.icon }}</span>
                        <span class="font-medium text-sm" style="color: var(--clr-text)">
                          {{ reason.labelKey | translate }}
                        </span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>

          </div>
        }

        <!-- Step 2 — Description + Evidence -->
        @if (step() === 2) {
          <div class="space-y-4">

            <!-- Description -->
            <div>
              <h2 class="text-base font-semibold mb-2" style="color: var(--clr-text)">
                {{ 'disputes.create.descTitle' | translate }}
              </h2>
              <textarea
                formControlName="description"
                rows="5"
                [placeholder]="'disputes.create.descPh' | translate"
                class="w-full px-4 py-3 border-2 rounded-xl text-sm outline-none resize-none transition-colors"
                [style.border-color]="form.get('description')?.invalid && form.get('description')?.touched
                  ? 'var(--clr-error)' : 'var(--clr-border)'"
                style="color: var(--clr-text); background: #F8FAFC; focus:border-color: var(--clr-primary)"
              ></textarea>
              <p class="text-xs mt-1 text-right" style="color: var(--clr-muted)">
                {{ form.get('description')?.value?.length ?? 0 }}/1000
              </p>
            </div>

            <!-- Evidence -->
            <div>
              <p class="text-sm font-semibold mb-1" style="color: var(--clr-text)">
                {{ 'disputes.create.evidenceTitle' | translate }}
                <span class="text-xs font-normal ml-1" style="color: var(--clr-muted)">
                  {{ 'disputes.create.evidenceOpt' | translate }}
                </span>
              </p>
              <p class="text-xs mb-2" style="color: var(--clr-muted)">
                {{ 'disputes.create.evidenceLimit' | translate }}
              </p>

              <!-- Drop zone -->
              @if (selectedFiles().length < 5) {
                <label
                  class="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl
                         cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50"
                  style="border-color: var(--clr-border)">
                  <input type="file" class="sr-only"
                         multiple
                         accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,application/pdf,text/plain"
                         (change)="onFilesChange($event)" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                       style="color: var(--clr-muted)">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span class="text-sm font-medium" style="color: var(--clr-muted)">
                    {{ 'disputes.create.evidenceBtn' | translate }}
                  </span>
                </label>
              }

              <!-- File list -->
              @if (selectedFiles().length > 0) {
                <div class="mt-2 space-y-1.5">
                  @for (sf of selectedFiles(); track sf.file.name; let i = $index) {
                    <div class="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                         [style.border-color]="sf.error ? 'var(--clr-error)' : 'var(--clr-border)'"
                         [style.background]="sf.error ? '#FEF2F2' : '#F8FAFC'">
                      <span class="text-base leading-none">{{ fileIcon(sf.file.type) }}</span>
                      <div class="flex-1 min-w-0">
                        <p class="truncate font-medium text-xs" style="color: var(--clr-text)">
                          {{ sf.file.name }}
                        </p>
                        @if (sf.error) {
                          <p class="text-xs" style="color: var(--clr-error)">{{ sf.error }}</p>
                        } @else {
                          <p class="text-xs" style="color: var(--clr-muted)">{{ formatSize(sf.file.size) }}</p>
                        }
                      </div>
                      <button type="button" (click)="removeFile(i)"
                              class="w-6 h-6 flex items-center justify-center rounded-md shrink-0"
                              style="background: #E2E8F0; color: #64748B">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="flex gap-2">
              <button type="button" (click)="step.set(1)"
                      class="flex-1 py-3 border rounded-xl text-sm font-medium transition-colors"
                      style="border-color: var(--clr-border); color: var(--clr-muted)">
                ← {{ 'disputes.create.back' | translate }}
              </button>
              <button type="button" (click)="step.set(3)"
                      [disabled]="form.get('description')?.invalid"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white
                             transition-colors disabled:opacity-50"
                      style="background: var(--clr-primary)">
                {{ 'disputes.create.continue' | translate }}
              </button>
            </div>
          </div>
        }

        <!-- Step 3 — Summary -->
        @if (step() === 3) {
          <div class="space-y-4">
            <h2 class="text-base font-semibold" style="color: var(--clr-text)">
              {{ 'disputes.create.summaryTitle' | translate }}
            </h2>

            <div class="rounded-2xl border divide-y text-sm" style="border-color: var(--clr-border)">

              <!-- Transaction -->
              <div class="px-4 py-3">
                <p class="text-xs font-semibold mb-0.5" style="color: var(--clr-muted)">
                  {{ 'disputes.create.transactionLabel' | translate }}
                </p>
                @if (transaction()) {
                  <div class="flex justify-between items-center">
                    <p class="font-medium" style="color: var(--clr-text)">{{ transaction()!.reference }}</p>
                    <p class="font-bold" style="color: var(--clr-primary)">
                      {{ transaction()!.grossAmount | amount }}
                    </p>
                  </div>
                } @else {
                  <p style="color: var(--clr-text)">{{ transactionId() }}</p>
                }
              </div>

              <!-- Reason -->
              <div class="px-4 py-3">
                <p class="text-xs font-semibold mb-0.5" style="color: var(--clr-muted)">
                  {{ 'disputes.create.motifLabel' | translate }}
                </p>
                <p class="font-medium" style="color: var(--clr-text)">
                  {{ selectedReasonLabel() | translate }}
                </p>
              </div>

              <!-- Description -->
              <div class="px-4 py-3">
                <p class="text-xs font-semibold mb-0.5" style="color: var(--clr-muted)">
                  {{ 'disputes.create.descTitle' | translate }}
                </p>
                <p class="leading-relaxed" style="color: var(--clr-text)">
                  {{ form.get('description')?.value }}
                </p>
              </div>

              <!-- Files -->
              <div class="px-4 py-3">
                <p class="text-xs font-semibold mb-0.5" style="color: var(--clr-muted)">
                  {{ 'disputes.create.filesAttached' | translate }}
                </p>
                @if (validFiles().length === 0) {
                  <p style="color: var(--clr-muted)">{{ 'disputes.create.noFiles' | translate }}</p>
                } @else {
                  <div class="space-y-1 mt-1">
                    @for (sf of validFiles(); track sf.file.name) {
                      <div class="flex items-center gap-2 text-xs" style="color: var(--clr-text)">
                        <span>{{ fileIcon(sf.file.type) }}</span>
                        <span class="truncate">{{ sf.file.name }}</span>
                        <span class="shrink-0" style="color: var(--clr-muted)">{{ formatSize(sf.file.size) }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

            </div>

            <div class="flex gap-2">
              <button type="button" (click)="step.set(2)"
                      class="flex-1 py-3 border rounded-xl text-sm font-medium"
                      style="border-color: var(--clr-border); color: var(--clr-muted)">
                ← {{ 'disputes.create.modify' | translate }}
              </button>
              <button type="submit"
                      [disabled]="loading() || form.invalid"
                      class="flex-1 py-3 rounded-xl text-sm font-semibold text-white
                             flex items-center justify-center gap-2 disabled:opacity-50"
                      style="background: var(--clr-error)">
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
  private readonly route          = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly escrowService  = inject(EscrowService);
  private readonly toast          = inject(ToastService);
  private readonly router         = inject(Router);
  private readonly fb             = inject(FormBuilder);
  private readonly auth           = inject(AuthStore);
  private readonly translate      = inject(TranslateService);

  protected readonly step          = signal(1);
  protected readonly loading       = signal(false);
  protected readonly txLoading     = signal(false);
  protected readonly transactionId = signal('');
  protected readonly initiatorRole = signal<'BUYER' | 'SELLER'>('BUYER');
  protected readonly transaction   = signal<TransactionDetail | null>(null);
  protected readonly selectedFiles = signal<SelectedFile[]>([]);
  protected readonly reasonGroups  = REASON_GROUPS;
  protected readonly stepLabels    = [
    'disputes.create.stepReason',
    'disputes.create.stepDesc',
    'disputes.create.stepSummary',
  ];

  protected readonly form = this.fb.group({
    reason:      ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    const txId = this.route.snapshot.queryParamMap.get('transactionId') ?? '';
    this.transactionId.set(txId);
    if (txId) {
      this.txLoading.set(true);
      this.escrowService.getTransaction(txId).subscribe({
        next: (tx) => {
          this.transaction.set(tx);
          this.initiatorRole.set(tx.buyerId === this.auth.user()?.userId ? 'BUYER' : 'SELLER');
          this.txLoading.set(false);
        },
        error: () => this.txLoading.set(false),
      });
    }
  }

  protected validFiles(): SelectedFile[] {
    return this.selectedFiles().filter(sf => !sf.error);
  }

  protected selectedReasonLabel(): string {
    const val = this.form.get('reason')?.value;
    for (const group of REASON_GROUPS) {
      const found = group.reasons.find(r => r.value === val);
      if (found) return found.labelKey;
    }
    return '';
  }

  protected onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files  = Array.from(input.files ?? []);
    const current = this.selectedFiles();
    const slots   = MAX_FILES - current.length;

    const added: SelectedFile[] = files.slice(0, slots).map(file => {
      let error: string | undefined;
      if (file.size > MAX_FILE_BYTES) {
        error = this.translate.instant('disputes.create.fileTooLarge');
      } else if (!ALLOWED_TYPES.has(file.type)) {
        error = this.translate.instant('disputes.create.fileTypeNotAllowed');
      }
      return {
        file,
        evidenceType: file.type.startsWith('image/') ? 'IMAGE'
                    : file.type.startsWith('video/') ? 'VIDEO'
                    : 'DOCUMENT',
        error,
      };
    });

    this.selectedFiles.update(sf => [...sf, ...added]);
    input.value = '';
  }

  protected removeFile(index: number): void {
    this.selectedFiles.update(sf => sf.filter((_, i) => i !== index));
  }

  protected fileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true); // prevent double-submit

    const userId       = this.auth.user()!.userId;
    const validFiles   = this.validFiles();

    this.disputeService.createDispute({
      transactionId: this.transactionId(),
      initiatorId:   userId,
      initiatorRole: this.initiatorRole(),
      reason:        this.form.value.reason as DisputeReason,
      description:   this.form.value.description!,
    }).pipe(
      switchMap(dispute =>
        validFiles.length === 0
          ? of(dispute)
          : forkJoin(
              validFiles.map(sf =>
                this.disputeService.uploadEvidence(dispute.id, sf.file, sf.evidenceType),
              ),
            ).pipe(map(() => dispute)),
      ),
    ).subscribe({
      next: (dispute) => {
        this.loading.set(false);
        this.toast.success(this.translate.instant('disputes.create.successToast'));
        this.router.navigate(['/disputes', dispute.id]);
      },
      error: () => this.loading.set(false),
    });
  }
}
