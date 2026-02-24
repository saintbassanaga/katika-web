import { Component, ElementRef, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom, interval, takeWhile } from 'rxjs';
import { EscrowService } from '../escrow.service';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="px-4 py-6 max-w-sm mx-auto text-center">
      <a [routerLink]="['/escrow', id()]" class="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-gray-700">
        ← Retour
      </a>

      <h1 class="text-xl font-bold text-gray-900 mb-2">Mon QR code de livraison</h1>
      <p class="text-sm text-gray-500 mb-6">
        Montrez ce QR code à l'acheteur pour confirmer la livraison
      </p>

      @if (loading()) {
        <div class="w-64 h-64 bg-gray-100 animate-pulse rounded-2xl mx-auto"></div>
      } @else {
        <div class="bg-white rounded-2xl p-4 shadow-sm inline-block">
          <canvas #qrCanvas></canvas>
        </div>

        @if (ttl() > 0) {
          <p class="text-sm text-gray-500 mt-4">
            Expire dans <span class="font-semibold text-blue-600">{{ formatTtl() }}</span>
          </p>
        }

        <button
          (click)="refresh()"
          class="mt-4 px-6 py-3 border border-gray-200 rounded-xl text-sm
                 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          🔄 Actualiser le code
        </button>
      }
    </div>
  `,
})
export class QrDisplayComponent implements OnInit {
  readonly id = input.required<string>();

  @ViewChild('qrCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private readonly escrowService = inject(EscrowService);

  protected readonly loading = signal(true);
  protected readonly ttl = signal(0);

  async ngOnInit(): Promise<void> {
    await this.loadQr();
  }

  protected async refresh(): Promise<void> {
    this.loading.set(true);
    await this.loadQr();
  }

  private readonly EXPIRATION_MINUTES = 15;

  private async loadQr(): Promise<void> {
    try {
      const { verificationCode: code } = await firstValueFrom(
        this.escrowService.generateVerificationCode(this.id(), this.EXPIRATION_MINUTES),
      );

      // Compute TTL from the expiration we requested
      this.ttl.set(this.EXPIRATION_MINUTES * 60);

      // Countdown
      interval(1000).pipe(takeWhile(() => this.ttl() > 0))
        .subscribe(() => this.ttl.update(t => t - 1));

      // Render QR
      this.loading.set(false);
      setTimeout(async () => {
        const QRCode = (await import('qrcode')).default;
        await QRCode.toCanvas(this.canvas.nativeElement, code, {
          width: 256,
          errorCorrectionLevel: 'H',
          color: { dark: '#0F172A', light: '#FFFFFF' },
        });
      }, 50);

      // Auto-maximize brightness
      try { (screen as any).orientation?.lock?.('portrait'); } catch {}
    } catch {
      this.loading.set(false);
    }
  }

  protected formatTtl(): string {
    const t = this.ttl();
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
