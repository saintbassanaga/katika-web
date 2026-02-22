import { Component, ElementRef, inject, input, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { EscrowService } from '../escrow.service';

@Component({
  selector: 'app-qr-scan',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-black flex flex-col">
      <!-- Header -->
      <div class="absolute top-0 left-0 right-0 z-10 p-4 pt-12">
        <button (click)="router.navigate(['/escrow', id()])" class="text-white text-sm flex items-center gap-2">
          ← Retour
        </button>
        <h1 class="text-white font-bold text-lg mt-2">Scanner le QR code</h1>
      </div>

      @if (permissionDenied()) {
        <div class="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div class="text-5xl mb-4">📷</div>
          <h2 class="text-white text-xl font-bold mb-2">Accès caméra refusé</h2>
          <p class="text-gray-400 text-sm mb-4">Autorisez l'accès à la caméra dans les paramètres de votre navigateur pour scanner le QR code.</p>
          <button (click)="ngOnInit()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">
            Réessayer
          </button>
        </div>
      } @else {
        <video #videoEl autoplay playsinline muted class="w-full h-full object-cover"></video>

        <!-- Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="w-64 h-64 border-2 border-white/70 rounded-2xl relative">
            <!-- Corner decorations -->
            <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
            <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
            <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
            <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
            <!-- Scanning line animation -->
            @if (!releasing()) {
              <div class="absolute left-2 right-2 h-0.5 bg-blue-400 scanning-line"></div>
            }
          </div>

          @if (releasing()) {
            <div class="mt-6 flex items-center gap-3 bg-white/20 px-6 py-3 rounded-full">
              <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span class="text-white font-medium">Libération en cours...</span>
            </div>
          } @else {
            <p class="mt-6 text-white text-sm text-center px-8">
              Placez le QR code du vendeur dans le cadre
            </p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes scan {
      0% { top: 8px; }
      50% { top: calc(100% - 8px); }
      100% { top: 8px; }
    }
    .scanning-line { animation: scan 2s ease-in-out infinite; }
  `],
})
export class QrScanComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  protected readonly router = inject(Router);
  private readonly escrowService = inject(EscrowService);

  protected readonly permissionDenied = signal(false);
  protected readonly releasing = signal(false);
  private scanning = false;
  private reader: any;

  async ngOnInit(): Promise<void> {
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.permissionDenied.set(false);
      setTimeout(() => this.startScanning(), 100);
    } catch {
      this.permissionDenied.set(true);
    }
  }

  private async startScanning(): Promise<void> {
    const { BrowserQRCodeReader } = await import('@zxing/browser');
    this.reader = new BrowserQRCodeReader();
    this.scanning = true;
    try {
      const result = await this.reader.decodeOnceFromVideoDevice(undefined, this.videoEl?.nativeElement);
      if (this.scanning) this.onScanned(result.getText());
    } catch {
      // Ignore scan errors
    }
  }

  private onScanned(verificationCode: string): void {
    this.scanning = false;
    this.releasing.set(true);
    this.escrowService.release(this.id(), verificationCode).subscribe({
      next: () => this.router.navigate(['/escrow', this.id()]),
      error: () => {
        this.releasing.set(false);
        setTimeout(() => { this.scanning = true; this.startScanning(); }, 1000);
      },
    });
  }

  ngOnDestroy(): void {
    this.scanning = false;
  }
}
