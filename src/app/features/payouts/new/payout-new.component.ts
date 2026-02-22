import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PayoutService } from '../payout.service';
import { AuthStore } from '../../../core/auth/auth.store';
import { AmountPipe } from '../../../shared/pipes/amount.pipe';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];
const PROVIDERS = [
  { value: 'CAMPAY',   label: 'Campay',   color: 'bg-orange-100 text-orange-700' },
  { value: 'MONETBIL', label: 'Monetbil', color: 'bg-green-100 text-green-700'   },
];

@Component({
  selector: 'app-payout-new',
  standalone: true,
  imports: [ReactiveFormsModule, AmountPipe, PhoneInputComponent],
  template: `
    <div class="px-4 py-6 max-w-sm mx-auto">
      <h1 class="text-xl font-bold text-gray-900 mb-2">Retrait</h1>

      @if (balance() !== null) {
        <div class="bg-blue-50 rounded-2xl p-4 mb-6">
          <p class="text-xs text-blue-600 font-medium mb-1">Solde disponible</p>
          <p class="text-2xl font-bold text-blue-700">{{ balance() | amount }}</p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Montant</label>
          <div class="flex gap-2 mb-3 flex-wrap">
            @for (amount of quickAmounts; track amount) {
              <button
                type="button"
                (click)="setAmount(amount)"
                class="px-3 py-2 border rounded-xl text-sm font-medium transition-colors"
                [class.bg-blue-600]="form.get('amount')?.value === amount"
                [class.text-white]="form.get('amount')?.value === amount"
                [class.border-blue-600]="form.get('amount')?.value === amount"
                [class.border-gray-200]="form.get('amount')?.value !== amount"
                [class.text-gray-600]="form.get('amount')?.value !== amount"
              >
                {{ amount | amount }}
              </button>
            }
            <button
              type="button"
              (click)="setAmount(balance()!)"
              class="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
            >
              Tout
            </button>
          </div>
          <input
            type="number"
            formControlName="amount"
            placeholder="Autre montant..."
            min="500"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm
                   focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>

        <!-- Provider -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
          <div class="grid grid-cols-2 gap-2">
            @for (p of providers; track p.value) {
              <label
                class="flex items-center justify-center py-3 border-2 rounded-xl cursor-pointer font-semibold text-sm transition-colors"
                [class.border-blue-600]="form.get('provider')?.value === p.value"
                [class.bg-blue-50]="form.get('provider')?.value === p.value"
                [class.border-gray-200]="form.get('provider')?.value !== p.value"
              >
                <input type="radio" formControlName="provider" [value]="p.value" class="sr-only" />
                {{ p.label }}
              </label>
            }
          </div>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Numéro de réception</label>
          <app-phone-input formControlName="phone" />
        </div>

        <!-- Fee preview -->
        @if (form.get('amount')?.value! > 0) {
          <div class="bg-gray-50 rounded-xl p-4 text-sm">
            <div class="flex justify-between text-gray-500 mb-1">
              <span>Frais estimés</span>
              <span>{{ estimatedFee() | amount }}</span>
            </div>
            <div class="flex justify-between font-semibold text-gray-900">
              <span>Vous recevrez</span>
              <span class="text-green-600">{{ netAmount() | amount }}</span>
            </div>
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || loading()"
          class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm
                 hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px]
                 flex items-center justify-center gap-2"
        >
          @if (loading()) {
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          }
          Continuer
        </button>
      </form>
    </div>
  `,
})
export class PayoutNewComponent implements OnInit {
  private readonly payoutService = inject(PayoutService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly balance = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly quickAmounts = QUICK_AMOUNTS;
  protected readonly providers = PROVIDERS;

  protected readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(500)]],
    provider: ['CAMPAY', Validators.required],
    phone: ['', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    try {
      const wallet = await firstValueFrom(this.payoutService.getBalance());
      this.balance.set(wallet.balance);
    } catch {}
  }

  protected setAmount(amount: number): void {
    this.form.patchValue({ amount });
  }

  protected estimatedFee(): number {
    const amount = this.form.get('amount')?.value ?? 0;
    return Math.ceil(amount * 0.005);
  }

  protected netAmount(): number {
    const amount = this.form.get('amount')?.value ?? 0;
    return amount - this.estimatedFee();
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const v = this.form.value;
    this.payoutService.create({
      amount: v.amount!,
      provider: v.provider as 'CAMPAY' | 'MONETBIL',
      phone: v.phone!,
    }).subscribe({
      next: ({ payoutId }) => {
        this.payoutService.requestOtp(payoutId).subscribe({
          next: () => this.router.navigate(['/payouts', payoutId, 'otp']),
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
