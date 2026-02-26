import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { EscrowService } from '@features/escrow/escrow.service';
import { ToastService } from '@core/notification/toast.service';
import { PhoneInputComponent } from '../phone-input/phone-input.component';

interface FabConfig {
  labelKey: string;
  icon: 'plus' | 'flag';
  action: 'escrow' | 'dispute';
}

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneInputComponent, TranslatePipe],
  styles: [`
    /* ── FAB button ─────────────────────────────── */
    :host {
      position: fixed;
      right: 1.25rem;
      bottom: calc(4.75rem + env(safe-area-inset-bottom));
      z-index: 40;
      pointer-events: none;
    }
    @media (min-width: 768px) {
      :host { bottom: 2rem; }
    }
    .fab {
      position: relative;
      pointer-events: auto;
      display: flex; align-items: center; gap: .5rem;
      padding: .75rem 1.25rem .75rem .875rem;
      border-radius: 99px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .875rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      box-shadow: 0 6px 24px rgba(27,79,138,.45), 0 2px 8px rgba(0,0,0,.15);
      transition: transform .2s, box-shadow .2s, opacity .2s;
      white-space: nowrap;
    }
    .fab:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(27,79,138,.5); }
    .fab:active { transform: translateY(0); }
    .fab.dispute-mode {
      background: linear-gradient(135deg, #DC2626, #B91C1C);
      box-shadow: 0 6px 24px rgba(220,38,38,.4), 0 2px 8px rgba(0,0,0,.15);
    }
    .fab.dispute-mode:hover { box-shadow: 0 10px 30px rgba(220,38,38,.45); }
    .fab-icon {
      width: 22px; height: 22px; border-radius: 99px;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Overlay ─────────────────────────────────── */
    .overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,.5);
      backdrop-filter: blur(2px);
      animation: fadeIn .2s ease both;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* ── Bottom sheet ────────────────────────────── */
    .sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 51;
      background: #fff; border-radius: 24px 24px 0 0;
      padding: 0 0 env(safe-area-inset-bottom);
      box-shadow: 0 -8px 40px rgba(0,0,0,.18);
      animation: slideUp .3s cubic-bezier(0.22,1,0.36,1) both;
      max-height: 92svh; overflow-y: auto;
    }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    @media (min-width: 768px) {
      .sheet {
        left: 50%; right: auto;
        transform: translateX(-50%);
        width: 520px; border-radius: 24px;
        bottom: 2rem;
        max-height: 88svh;
      }
    }

    /* ── Sheet header ────────────────────────────── */
    .sheet-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem 1rem;
      border-bottom: 1px solid #EDF1F7;
      position: sticky; top: 0; background: #fff; z-index: 1;
      border-radius: 24px 24px 0 0;
    }
    .drag-handle {
      position: absolute; top: .625rem; left: 50%; transform: translateX(-50%);
      width: 36px; height: 4px; border-radius: 99px; background: #E2E8F0;
    }
    .sheet-title { font-size: 1.0625rem; font-weight: 700; color: #0F2240; letter-spacing: -.01em; }
    .close-btn {
      width: 32px; height: 32px; border-radius: 10px;
      background: #EDF1F7; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #64748B; transition: background .15s; flex-shrink: 0;
    }
    .close-btn:hover { background: #E2E8F0; }

    /* ── Form ────────────────────────────────────── */
    .sheet-body { padding: 1.25rem 1.5rem 1.75rem; }

    .field { margin-bottom: 1.125rem; }
    .label {
      display: block; font-size: .8125rem; font-weight: 600;
      color: #334155; margin-bottom: .4rem;
    }
    .label-opt { color: #94A3B8; font-weight: 400; }
    .input {
      width: 100%; padding: .8125rem 1rem; box-sizing: border-box;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus { border-color: #1B4F8A; background: #fff; box-shadow: 0 0 0 4px rgba(27,79,138,.08); }
    .input.error { border-color: #DC2626; }
    .err { font-size: .75rem; color: #DC2626; margin: .3rem 0 0; }

    /* Amount wrapper with XAF suffix */
    .amount-wrap { position: relative; }
    .amount-suffix {
      position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      font-size: .8125rem; font-weight: 700; color: #94A3B8; pointer-events: none;
    }
    .input-amount { padding-right: 3.5rem; }

    /* Fee preview */
    .fee-preview {
      background: #E5EEF8; border-radius: 12px;
      padding: .875rem 1rem; margin-top: -.5rem; margin-bottom: 1.125rem;
      display: flex; flex-direction: column; gap: .3rem;
    }
    .fee-row { display: flex; justify-content: space-between; align-items: center; }
    .fee-label { font-size: .8125rem; color: #64748B; font-weight: 500; }
    .fee-value { font-size: .8125rem; font-weight: 700; color: #0F172A; }
    .fee-net   { font-size: .9375rem; font-weight: 800; color: #1B4F8A; }
    .fee-sep   { border: none; border-top: 1px solid #C8DCF2; margin: .25rem 0; }

    /* Submit */
    .submit-btn {
      width: 100%; padding: .9375rem; border-radius: 14px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 52px; box-shadow: 0 4px 16px rgba(27,79,138,.35);
      transition: opacity .2s, transform .15s; margin-top: .5rem;
    }
    .submit-btn:hover:not(:disabled) { opacity: .91; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hint { font-size: .75rem; color: #94A3B8; margin: .3rem 0 0; }
  `],
  template: `
    <!-- FAB button -->
    @if (fabConfig(); as cfg) {
      <button
        class="fab"
        [class.dispute-mode]="cfg.action === 'dispute'"
        (click)="onFabClick(cfg)"
        [attr.aria-label]="cfg.labelKey | translate"
      >
        <span class="fab-icon">
          @if (cfg.icon === 'plus') {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          } @else {
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          }
        </span>
        {{ cfg.labelKey | translate }}
      </button>
    }

    <!-- Overlay + Bottom sheet (new transaction) -->
    @if (sheetOpen()) {
      <div class="overlay" (click)="closeSheet()"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <div class="drag-handle"></div>
          <span class="sheet-title">{{ 'fab.form.title' | translate }}</span>
          <button class="close-btn" (click)="closeSheet()" [attr.aria-label]="'common.close' | translate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="sheet-body">
          <form [formGroup]="txForm" (ngSubmit)="submitTransaction()">

            <!-- Buyer phone -->
            <div class="field">
              <label class="label">{{ 'fab.form.buyerPhone' | translate }}</label>
              <app-phone-input formControlName="buyerPhone" />
              @if (txForm.get('buyerPhone')?.invalid && txForm.get('buyerPhone')?.touched) {
                <p class="err">Numéro requis</p>
              }
            </div>

            <!-- Amount -->
            <div class="field">
              <label class="label">{{ 'fab.form.amount' | translate }}</label>
              <div class="amount-wrap">
                <input type="number" formControlName="grossAmount"
                       placeholder="Ex. 50000"
                       class="input input-amount"
                       [class.error]="txForm.get('grossAmount')?.invalid && txForm.get('grossAmount')?.touched"
                       min="25" max="10000000" step="1" />
                <span class="amount-suffix">XAF</span>
              </div>
              @if (txForm.get('grossAmount')?.errors?.['min'] && txForm.get('grossAmount')?.touched) {
                <p class="err">Minimum 100 XAF</p>
              }
              @if (txForm.get('grossAmount')?.errors?.['max'] && txForm.get('grossAmount')?.touched) {
                <p class="err">Maximum 10 000 000 XAF</p>
              }
            </div>

            <!-- Fee preview -->
            @if (grossAmount() >= 100) {
              <div class="fee-preview">
                <div class="fee-row">
                  <span class="fee-label">{{ 'fab.form.grossAmount' | translate }}</span>
                  <span class="fee-value">{{ formatXAF(grossAmount()) }}</span>
                </div>
                <div class="fee-row">
                  <span class="fee-label">{{ 'fab.form.fee' | translate }}</span>
                  <span class="fee-value">- {{ formatXAF(platformFee()) }}</span>
                </div>
                <hr class="fee-sep">
                <div class="fee-row">
                  <span class="fee-label">{{ 'fab.form.youReceive' | translate }}</span>
                  <span class="fee-net">{{ formatXAF(netAmount()) }}</span>
                </div>
              </div>
            }

            <!-- Provider -->
            <div class="field">
              <label class="label">{{ 'fab.form.provider' | translate }}</label>
              <div style="display:flex; gap:.75rem;">
                @for (p of providers; track p.value) {
                  <button
                    type="button"
                    (click)="txForm.get('provider')!.setValue(p.value)"
                    style="flex:1; padding:.75rem; border-radius:12px; border:2px solid; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit;"
                    [style.border-color]="txForm.get('provider')?.value === p.value ? '#1B4F8A' : '#E2E8F0'"
                    [style.background]="txForm.get('provider')?.value === p.value ? '#EBF4FF' : '#F8FAFC'"
                    [style.color]="txForm.get('provider')?.value === p.value ? '#1B4F8A' : '#64748B'"
                  >{{ p.label }}</button>
                }
              </div>
            </div>

            <!-- Description -->
            <div class="field">
              <label class="label">{{ 'fab.form.description' | translate }} <span class="label-opt">{{ 'common.optional' | translate }}</span></label>
              <textarea formControlName="description"
                        placeholder="Objet de la transaction…"
                        class="input" rows="2"
                        style="resize:vertical; min-height:68px"></textarea>
              <p class="hint">Max. 500 caractères</p>
            </div>

            <!-- Deadline -->
            <div class="field">
              <label class="label">{{ 'fab.form.deadline' | translate }} <span class="label-opt">{{ 'common.optional' | translate }}</span></label>
              <input type="datetime-local" formControlName="deliveryDeadline"
                     class="input" />
              <p class="hint">L'acheteur devra confirmer la réception avant cette date.</p>
            </div>

            <button type="submit" class="submit-btn"
                    [disabled]="txForm.invalid || loading()">
              @if (loading()) {
                <span class="spinner"></span> {{ 'fab.form.submitting' | translate }}
              } @else {
                {{ 'fab.form.submit' | translate }}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class FabComponent {
  private readonly router        = inject(Router);
  private readonly fb            = inject(FormBuilder);
  private readonly escrowService = inject(EscrowService);
  private readonly toast         = inject(ToastService);
  private readonly auth          = inject(AuthStore);

  /* ── Route detection ─────────────────────────── */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  private static readonly FAB_ROUTES: Array<{ pattern: RegExp; config: FabConfig }> = [
    {
      // Dashboard & escrow list — transaction FAB
      pattern: /^\/(dashboard|escrow)(\/?)(\?.*)?$/,
      config: { labelKey: 'fab.newTransaction', icon: 'plus', action: 'escrow' },
    },
    {
      // Disputes list only — dispute FAB
      pattern: /^\/disputes(\/?)(\?.*)?$/,
      config: { labelKey: 'fab.newDispute', icon: 'flag', action: 'dispute' },
    },
  ];

  protected readonly fabConfig = computed<FabConfig | null>(() => {
    if (!this.auth.isAuthenticated()) return null;
    const url = this.currentUrl() ?? '';
    const match = FabComponent.FAB_ROUTES.find(r => r.pattern.test(url));
    return match?.config ?? null;
  });

  /* ── Sheet state ─────────────────────────────── */
  protected readonly sheetOpen = signal(false);
  protected readonly loading   = signal(false);

  protected readonly providers = [
    { value: 'CAMPAY'   as const, label: 'CamPay' },
    { value: 'MONETBIL' as const, label: 'MonetBil' },
  ];

  /* ── Transaction form ────────────────────────── */
  protected readonly txForm = this.fb.group({
    buyerPhone:       ['', Validators.required],
    grossAmount:      [null as number | null, [Validators.required, Validators.min(25), Validators.max(10_000_000)]],
    provider:         ['CAMPAY' as 'CAMPAY' | 'MONETBIL', Validators.required],
    description:      [''],
    deliveryDeadline: [''],
  });

  /* ── Fee preview ─────────────────────────────── */
  protected readonly grossAmount = computed(() => {
    const v = this.txForm.get('grossAmount')?.value;
    return typeof v === 'number' && v >= 100 ? Math.floor(v) : 0;
  });
  protected readonly platformFee = computed(() => Math.floor(this.grossAmount() * 0.03));
  protected readonly netAmount   = computed(() => this.grossAmount() - this.platformFee());

  protected formatXAF(n: number): string {
    return new Intl.NumberFormat('fr-CM', { style: 'decimal' }).format(n) + ' XAF';
  }

  /* ── Actions ─────────────────────────────────── */
  protected onFabClick(cfg: FabConfig): void {
    if (cfg.action === 'dispute') {
      this.router.navigate(['/disputes/create']);
    } else {
      this.sheetOpen.set(true);
    }
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    this.txForm.reset();
  }

  protected async submitTransaction(): Promise<void> {
    if (this.txForm.invalid) { this.txForm.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.txForm.value;
    try {
      const tx = await firstValueFrom(this.escrowService.createTransaction({
        buyerPhone:       v.buyerPhone!,
        grossAmount:      Math.floor(v.grossAmount!),
        provider:         v.provider!,
        description:      v.description || undefined,
        deliveryDeadline: v.deliveryDeadline
          ? new Date(v.deliveryDeadline).toISOString()
          : undefined,
        idempotencyKey:   crypto.randomUUID(),
      }));
      this.toast.success('Transaction créée avec succès.');
      this.closeSheet();
      this.router.navigate(['/escrow', tx.id]);
    } catch {
      // error interceptor handles toast
    } finally {
      this.loading.set(false);
    }
  }
}
