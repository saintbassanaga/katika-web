import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StompSubscription } from '@stomp/stompjs';

import {
  DisputeService,
  DisputeResponse,
  DisputeMessage,
  DisputeStatusEvent,
} from '../dispute.service';
import { StompService } from '@core/websocket/stomp.service';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TimelineStep } from '@shared/models/model';

@Component({
  selector: 'app-dispute-chat',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TimeAgoPipe, TitleCasePipe, TranslatePipe, AmountPipe],
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    /* ── DETAILS SIDEBAR ──────────────────────────── */
    .ds-panel {
      display: none;
      flex-direction: column;
      width: 300px;
      flex-shrink: 0;
      overflow-y: auto;
      background: linear-gradient(170deg, #F4F7FB 0%, #EBF0F8 100%);
      position: relative;
    }

    .ds-panel::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, #1B4F8A 0%, #C9920D 50%, #1B4F8A 100%);
      z-index: 2;
    }

    @media (min-width: 768px) {
      .ds-panel { display: flex; }
    }

    .ds-header {
      position: sticky;
      top: 0; z-index: 10;
      background: #0F2240;
      padding: 0.875rem 1.125rem;
      border-bottom: 1px solid rgba(255,255,255,.07);
      flex-shrink: 0;
    }

    .ds-header-inner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ds-header-accent {
      width: 3px; height: 14px;
      background: #C9920D;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .ds-header-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,.45);
      margin: 0;
    }

    .ds-body {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .ds-card {
      background: #fff;
      border-radius: 12px;
      padding: 0.875rem;
      border: 1px solid rgba(226,232,240,.9);
      box-shadow: 0 1px 4px rgba(15,23,42,.05);
    }

    .ds-section-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94A3B8;
      margin: 0 0 0.625rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .ds-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #C9920D;
      flex-shrink: 0;
    }

    .ds-kv { margin-bottom: 0.5rem; }
    .ds-kv:last-child { margin-bottom: 0; }

    .ds-key {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #94A3B8;
      margin: 0 0 0.2rem;
    }

    .ds-val {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0F172A;
      margin: 0;
    }

    .ds-val-mono {
      font-size: 0.8125rem;
      font-family: 'Courier New', monospace;
      color: #334155;
      margin: 0;
      word-break: break-all;
    }

    .ds-party {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0;
    }

    .ds-party + .ds-party { border-top: 1px solid #F1F5F9; }

    .ds-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .ds-party-info { flex: 1; min-width: 0; }
    .ds-party-name { font-size: 0.8125rem; font-weight: 700; color: #0F172A; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ds-party-role { font-size: 0.6875rem; color: #94A3B8; margin: 0; }

    .ds-you {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 99px;
      flex-shrink: 0;
    }

    .ds-amounts { display: flex; gap: 0.5rem; }
    .ds-amount-box { flex: 1; border-radius: 10px; padding: 0.625rem 0.75rem; }

    /* ── TIMELINE ──────────────────────────────────── */
    .tl-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.75rem;
      margin-top: 0.25rem;
    }

    .tl-line-h {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, #E2E8F0, transparent);
    }

    .tl-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94A3B8;
    }

    .tl-steps { padding: 0.5rem 0.75rem 2rem; }

    .tl-step {
      display: flex;
      gap: 0.75rem;
      padding-bottom: 1rem;
      position: relative;
    }

    .tl-step:last-child { padding-bottom: 0; }

    .tl-stem {
      position: absolute;
      left: 9px;
      top: 22px; bottom: 0;
      width: 2px;
      border-radius: 1px;
    }

    .tl-dot {
      width: 20px; height: 20px;
      border-radius: 50%;
      flex-shrink: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.5625rem;
      font-weight: 800;
      position: relative;
    }

    .tl-dot-done { background: #10B981; color: #fff; }
    .tl-dot-now  { background: #1B4F8A; color: #fff; box-shadow: 0 0 0 4px rgba(27,79,138,.15); }
    .tl-dot-next { background: #E2E8F0; color: #94A3B8; }

    .tl-dot-inner {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #fff;
    }

    .tl-text { flex: 1; min-width: 0; padding-top: 0.125rem; }
    .tl-text-done  { font-size: 0.8125rem; font-weight: 500; color: #059669; margin: 0; line-height: 1.3; }
    .tl-text-now   { font-size: 0.8125rem; font-weight: 700; color: #1B4F8A; margin: 0; line-height: 1.3; }
    .tl-text-next  { font-size: 0.8125rem; font-weight: 400; color: #94A3B8; margin: 0; line-height: 1.3; }
    .tl-sub        { font-size: 0.6875rem; color: #C9920D; margin: 0.125rem 0 0; font-weight: 500; }
  `],
  template: `
    <div class="animate-fade flex flex-col h-screen bg-page md:flex-row">

      <div class="flex flex-col min-h-0 flex-1">

        <!-- Topbar -->
        <div class="bg-dark px-4 py-3 flex items-center gap-3 shrink-0 shadow-[0_2px_12px_rgba(15,23,42,.25)]">
          <a routerLink="/disputes"
             class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </a>
          <div class="flex-1 min-w-0">
            @if (dispute()) {
              <h1 class="text-sm font-bold text-white truncate">
                {{ dispute()!.reference }}
              </h1>
              @if (typingUsers().length > 0) {
                <p class="text-xs text-blue-300 truncate">{{ typingUsers()[0] }} {{ 'disputes.chat.typingOne' | translate:{ name: '' } }}</p>
              } @else {
                <p class="text-xs text-white/60 truncate">
                  {{ dispute()!.buyerName }} &amp; {{ dispute()!.sellerName }}
                  @if (dispute()!.grossAmount) { · {{ dispute()!.grossAmount | amount }} }
                </p>
              }
            } @else {
              <h1 class="text-sm font-bold text-white">Litige</h1>
              <p class="text-xs text-white/50">{{ 'common.loading' | translate }}</p>
            }
          </div>
          <app-status-badge [status]="dispute()?.status ?? 'OPENED'" />
        </div>

        <!-- AWAITING_ARBITRATION_PAYMENT -->
        @if (dispute()?.status === 'AWAITING_ARBITRATION_PAYMENT') {
          <div class="shrink-0 mx-3 mt-3 bg-white rounded-2xl shadow-sm border-l-4 border-l-orange-400 overflow-hidden animate-fade">
            <div class="px-4 py-3.5">
              <div class="flex items-start gap-3 mb-3">
                <div class="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center bg-orange-50 text-lg">⚖️</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-900 m-0">{{ 'disputes.arbitration.title' | translate }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5">{{ 'disputes.arbitration.subtitle' | translate }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-orange-50 rounded-xl px-3 py-2.5">
                  <p class="text-[10px] font-semibold text-orange-600 uppercase tracking-wide m-0">{{ 'disputes.arbitration.fee' | translate }}</p>
                  <p class="text-base font-extrabold text-slate-900 m-0">{{ dispute()!.arbitrationFee | amount }}</p>
                </div>
                <div class="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide m-0">{{ 'disputes.arbitration.deadline' | translate }}</p>
                  @if (deadlinePassed()) {
                    <p class="text-xs font-bold text-red-600 m-0">{{ 'disputes.arbitration.deadlinePassed' | translate }}</p>
                  } @else {
                    <p class="text-sm font-bold text-slate-900 m-0 font-mono">{{ countdown() }}</p>
                  }
                </div>
              </div>
              <div class="flex gap-3 mb-3">
                <div class="flex items-center gap-1.5 text-xs"
                     [class.text-success]="dispute()!.buyerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.buyerArbitrationFeePaid">
                  <span class="text-base">{{ dispute()!.buyerArbitrationFeePaid ? '✓' : '✗' }}</span>
                  {{ 'disputes.arbitration.buyerPaid' | translate }}
                </div>
                <div class="flex items-center gap-1.5 text-xs"
                     [class.text-success]="dispute()!.sellerArbitrationFeePaid"
                     [class.text-slate-400]="!dispute()!.sellerArbitrationFeePaid">
                  <span class="text-base">{{ dispute()!.sellerArbitrationFeePaid ? '✓' : '✗' }}</span>
                  {{ 'disputes.arbitration.sellerPaid' | translate }}
                </div>
              </div>
              @if (!alreadyPaid() && !deadlinePassed()) {
                <div class="bg-amber-50 rounded-xl px-3 py-2 mb-3 border border-amber-200">
                  <p class="text-xs font-semibold text-amber-700 m-0 mb-1">⚠️ {{ 'disputes.arbitration.warning' | translate }}</p>
                  <p class="text-xs text-amber-600 m-0">• {{ 'disputes.arbitration.warningDefaultLose' | translate }}</p>
                  <p class="text-xs text-amber-600 m-0">• {{ 'disputes.arbitration.warningFundsReleased' | translate }}</p>
                </div>
              }
              @if (alreadyPaid() && dispute()!.status === 'AWAITING_ARBITRATION_PAYMENT') {
                <div class="bg-success-lt rounded-xl px-3 py-2 mb-3 border border-green-200">
                  <p class="text-xs font-semibold text-success m-0">✓ {{ 'disputes.arbitration.paid' | translate }}</p>
                </div>
              }
              @if (!alreadyPaid() && !deadlinePassed()) {
                <button
                  (click)="payArbitrationFee()"
                  [disabled]="paying()"
                  class="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                  style="background: linear-gradient(135deg, #F97316, #EA580C); box-shadow: 0 4px 16px rgba(249,115,22,.35)"
                >
                  @if (paying()) {
                    <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ 'disputes.arbitration.payingBtn' | translate }}
                  } @else {
                    ⚖️ {{ 'disputes.arbitration.payBtn' | translate }} — {{ dispute()!.arbitrationFee | amount }}
                  }
                </button>
              }
            </div>
          </div>
        }

        <!-- REFERRED_TO_ARBITRATION -->
        @if (dispute()?.status === 'REFERRED_TO_ARBITRATION') {
          <div class="shrink-0 mx-3 mt-3 bg-white rounded-2xl shadow-sm border-l-4 border-l-violet-500 overflow-hidden animate-fade">
            <div class="px-4 py-3.5">
              <div class="flex items-start gap-3 mb-2">
                <div class="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center bg-violet-50 text-lg">⚖️</div>
                <div class="flex-1">
                  <p class="text-sm font-bold text-slate-900 m-0">{{ 'disputes.arbitration.referredTitle' | translate }}</p>
                  <p class="text-xs text-slate-500 m-0 mt-0.5">{{ 'disputes.arbitration.referredBody' | translate }}</p>
                </div>
              </div>
              <div class="flex gap-4 mt-2">
                <div class="flex items-center gap-1.5 text-xs text-success">
                  <span class="text-base">✓</span>{{ 'disputes.arbitration.buyerPaid' | translate }}
                </div>
                <div class="flex items-center gap-1.5 text-xs text-success">
                  <span class="text-base">✓</span>{{ 'disputes.arbitration.sellerPaid' | translate }}
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-2 m-0">{{ 'disputes.arbitration.referredEmail' | translate }}</p>
            </div>
          </div>
        }

        <!-- TERMINAL outcome banner -->
        @if (isTerminal()) {
          <div class="shrink-0 mx-3 mt-3 rounded-2xl overflow-hidden animate-fade"
               [class]="terminalBannerClass()">
            <div class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">{{ terminalIcon() }}</span>
                <div>
                  <p class="text-sm font-bold m-0">{{ terminalTitle() | translate }}</p>
                  @if (dispute()!.refundedToBuyer) {
                    <p class="text-xs m-0 mt-0.5 opacity-80">{{ 'disputes.arbitration.refundedLabel' | translate }}: {{ dispute()!.refundedToBuyer | amount }}</p>
                  }
                  @if (dispute()!.releasedToSeller) {
                    <p class="text-xs m-0 mt-0.5 opacity-80">{{ 'disputes.arbitration.releasedLabel' | translate }}: {{ dispute()!.releasedToSeller | amount }}</p>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- MESSAGES -->
        <div #messagesContainer class="flex-1 overflow-y-auto px-3 py-3 scroll-smooth" (scroll)="onScroll()">
          <div class="flex flex-col gap-2.5 min-h-full">

            @for (msg of messages(); track msg.id) {
              @if (isStaffMessage(msg)) {
                <div class="flex justify-center px-2">
                  <div class="max-w-[80%] flex flex-col items-center gap-1">
                    <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      [class.bg-amber-100]="msg.messageType === 'SYSTEM'"
                      [class.text-amber-700]="msg.messageType === 'SYSTEM'"
                      [class.bg-indigo-100]="msg.messageType !== 'SYSTEM'"
                      [class.text-indigo-700]="msg.messageType !== 'SYSTEM'"
                    >
                      @if (msg.messageType === 'SYSTEM') {
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {{ 'disputes.chat.system' | translate }}
                      } @else {
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        {{ msg.senderRole | titlecase }} · {{ msg.senderName }}
                      }
                    </span>
                    <div class="rounded-2xl px-4 py-2.5 text-center border"
                      [class.bg-amber-50]="msg.messageType === 'SYSTEM'"
                      [class.border-amber-200]="msg.messageType === 'SYSTEM'"
                      [class.bg-indigo-50]="msg.messageType !== 'SYSTEM'"
                      [class.border-indigo-200]="msg.messageType !== 'SYSTEM'"
                    >
                      <p class="text-sm italic wrap-break-word whitespace-pre-wrap m-0"
                        [class.text-amber-800]="msg.messageType === 'SYSTEM'"
                        [class.text-indigo-800]="msg.messageType !== 'SYSTEM'"
                      >{{ msg.content }}</p>
                      <p class="text-[10px] mt-1 opacity-60 m-0"
                        [class.text-amber-600]="msg.messageType === 'SYSTEM'"
                        [class.text-indigo-600]="msg.messageType !== 'SYSTEM'"
                      >{{ msg.createdAt | timeAgo }}</p>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="flex w-full" [class.justify-end]="isOwnMessage(msg)">

                  @if (msg.messageType === 'FILE') {
                    <!-- File attachment bubble -->
                    @let meta = parseFileContent(msg.content);
                    <div class="max-w-[72%] flex flex-col gap-1"
                         [class.items-end]="isOwnMessage(msg)">
                      @if (!isOwnMessage(msg)) {
                        <p class="text-xs font-bold text-primary m-0 px-1">{{ msg.senderName }}</p>
                      }
                      <button type="button"
                              (click)="downloadFile(msg)"
                              [title]="('disputes.evidence.download' | translate) + ' ' + (meta?.name ?? '')"
                              class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all active:scale-[.98] text-left w-full"
                              [class.bg-primary]="isOwnMessage(msg)"
                              [class.border-blue-400]="isOwnMessage(msg)"
                              [class.text-white]="isOwnMessage(msg)"
                              [class.rounded-br-md]="isOwnMessage(msg)"
                              [class.bg-white]="!isOwnMessage(msg)"
                              [class.border-slate-200]="!isOwnMessage(msg)"
                              [class.rounded-bl-md]="!isOwnMessage(msg)"
                              [class.shadow-\[0_1px_4px_rgba(15\,23\,42\,\.08\)\]]="!isOwnMessage(msg)">
                        <span class="text-[1.375rem] leading-none shrink-0">{{ fileIcon(meta?.mimeType ?? '') }}</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-[.8125rem] font-semibold truncate m-0"
                             [class.text-white]="isOwnMessage(msg)"
                             [class.text-slate-800]="!isOwnMessage(msg)">{{ meta?.name ?? ('disputes.evidence.fileDefault' | translate) }}</p>
                          <p class="text-[.6875rem] m-0 mt-0.5"
                             [class.text-white/70]="isOwnMessage(msg)"
                             [class.text-slate-400]="!isOwnMessage(msg)">{{ formatFileSize(meta?.size ?? 0) }}</p>
                        </div>
                        <!-- download arrow -->
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 opacity-60">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <p class="text-[10px] opacity-50 m-0 px-1">{{ msg.createdAt | timeAgo }}</p>
                    </div>

                  } @else {
                    <!-- Text bubble -->
                    <div class="max-w-[80%] rounded-2xl px-4 py-2.5 shadow-[0_1px_4px_rgba(15,23,42,.08)]"
                      [class.bg-primary]="isOwnMessage(msg)"
                      [class.text-white]="isOwnMessage(msg)"
                      [class.rounded-br-md]="isOwnMessage(msg)"
                      [class.bg-white]="!isOwnMessage(msg)"
                      [class.rounded-bl-md]="!isOwnMessage(msg)"
                    >
                      @if (!isOwnMessage(msg)) {
                        <p class="text-xs font-bold text-primary mb-1 m-0">{{ msg.senderName }}</p>
                      }
                      <p class="text-sm wrap-break-word whitespace-pre-wrap m-0">{{ msg.content }}</p>
                      <p class="text-[10px] mt-1 text-right opacity-60 m-0">{{ msg.createdAt | timeAgo }}</p>
                    </div>
                  }

                </div>
              }
            }

            <div #scrollAnchor class="h-0"></div>
          </div>
        </div>

        <!-- INPUT -->
        @if (!isTerminal() && dispute()?.status !== 'REFERRED_TO_ARBITRATION') {
          <div class="bg-white border-t border-slate-100 px-3 py-2.5 flex gap-2 items-end shrink-0 shadow-[0_-2px_8px_rgba(15,23,42,.06)]">

            <!-- Attach button + popover anchor -->
            <div class="relative shrink-0">

              <!-- Hidden file input -->
              <input #fileInput type="file" class="sr-only"
                     accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,application/pdf"
                     (change)="onFileSelected($event)" />

              <!-- Trigger -->
              <button type="button"
                      (click)="openEvidenceDialog()"
                      [disabled]="uploadingFile()"
                      class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500 transition-all active:scale-95 disabled:opacity-40 hover:bg-slate-200">
                @if (uploadingFile()) {
                  <span class="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                }
              </button>

              <!-- Popover -->
              @if (evidenceDialogOpen()) {
                <div class="absolute bottom-[calc(100%+8px)] left-0 z-50 w-72 bg-white rounded-2xl shadow-[0_8px_32px_rgba(15,23,42,.18)] border border-slate-200 overflow-hidden">

                  <!-- Header -->
                  <div class="flex items-center justify-between px-3.5 pt-3 pb-2.5 border-b border-slate-100">
                    <p class="text-[.8125rem] font-bold text-slate-800 m-0">{{ 'disputes.evidence.panelTitle' | translate }}</p>
                    <button type="button" (click)="cancelEvidence()"
                            class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>

                  <div class="px-3.5 py-3 space-y-3">

                    <!-- Type chips -->
                    <div>
                      <p class="text-[.6875rem] font-bold uppercase tracking-wide text-slate-400 mb-1.5 m-0">{{ 'disputes.evidence.typeLabel' | translate }}</p>
                      <div class="flex flex-wrap gap-1.5">
                        @for (opt of evidenceTypeOptions; track opt.value) {
                          <button type="button"
                                  (click)="evidenceType.set(opt.value)"
                                  class="flex items-center gap-1 px-2.5 py-1 rounded-full text-[.75rem] font-semibold border transition-all"
                                  [class.bg-primary]="evidenceType() === opt.value"
                                  [class.border-primary]="evidenceType() === opt.value"
                                  [class.text-white]="evidenceType() === opt.value"
                                  [class.bg-white]="evidenceType() !== opt.value"
                                  [class.border-slate-200]="evidenceType() !== opt.value"
                                  [class.text-slate-600]="evidenceType() !== opt.value">
                            <span class="text-sm leading-none">{{ opt.icon }}</span>{{ opt.labelKey | translate }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Description -->
                    <input type="text"
                           [value]="evidenceDesc()"
                           (input)="evidenceDesc.set($any($event.target).value)"
                           [placeholder]="'disputes.evidence.descPh' | translate"
                           maxlength="200"
                           class="w-full px-3 py-2 border border-slate-200 rounded-xl text-[.8125rem] outline-none focus:border-primary transition-colors bg-slate-50 focus:bg-white font-[inherit]" />

                    <!-- File pick / preview -->
                    @if (pendingFile(); as f) {
                      <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                        <span class="text-base leading-none shrink-0">{{ fileIcon(f.type) }}</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-[.75rem] font-semibold text-slate-700 truncate m-0">{{ f.name }}</p>
                          <p class="text-[.6875rem] text-slate-400 m-0">{{ formatFileSize(f.size) }}</p>
                        </div>
                        <button type="button" (click)="fileInput.click()"
                                class="text-[.6875rem] font-semibold text-primary shrink-0 hover:underline">
                          {{ 'disputes.evidence.changeFile' | translate }}
                        </button>
                      </div>
                    } @else {
                      <button type="button" (click)="fileInput.click()"
                              class="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[.8125rem] font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        {{ 'disputes.evidence.filePh' | translate }}
                      </button>
                    }

                    <!-- Submit -->
                    <button type="button"
                            (click)="submitEvidence()"
                            [disabled]="!pendingFile() || uploadingFile()"
                            class="w-full py-2.5 rounded-xl text-[.8125rem] font-bold text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                            style="background: var(--clr-primary)">
                      @if (uploadingFile()) {
                        <span class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        {{ 'disputes.evidence.sending' | translate }}
                      } @else {
                        {{ 'disputes.evidence.upload' | translate }}
                      }
                    </button>
                  </div>
                </div>
              }

            </div><!-- end popover anchor -->

            <textarea
              [(ngModel)]="messageText"
              (input)="onTyping()"
              (keydown.enter)="$event.preventDefault(); sendMessage()"
              [placeholder]="'disputes.chat.placeholder' | translate"
              rows="1"
              class="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-primary transition-colors max-h-28 overflow-y-auto"
            ></textarea>

            <button
              (click)="sendMessage()"
              [disabled]="!messageText.trim() || sending()"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style="background: var(--clr-primary)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        }

      </div><!-- end left column -->

      <!-- RIGHT COLUMN -->
      <div class="hidden md:flex flex-col w-85 border-l border-slate-100 bg-white shrink-0 overflow-y-auto">

        <div class="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 m-0">{{ 'disputes.details.title' | translate }}</p>
        </div>

        @if (dispute()) {
          <div class="px-4 py-4 space-y-3">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.reference' | translate }}</p>
              <p class="text-sm font-bold text-slate-900 font-mono m-0">{{ dispute()!.reference }}</p>
            </div>
            <div class="flex items-center gap-2">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0">{{ 'disputes.details.status' | translate }}</p>
              <app-status-badge [status]="dispute()!.status" />
            </div>
            <div class="bg-slate-50 rounded-xl p-3 space-y-2.5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                  {{ dispute()!.buyerName?.[0]?.toUpperCase() ?? 'A' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 truncate m-0">{{ dispute()!.buyerName ?? '—' }}</p>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'disputes.details.buyer' | translate }}</p>
                </div>
                @if (isBuyer()) {
                  <span class="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">{{ 'disputes.details.you' | translate }}</span>
                }
              </div>
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 shrink-0">
                  {{ dispute()!.sellerName?.[0]?.toUpperCase() ?? 'V' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-900 truncate m-0">{{ dispute()!.sellerName ?? '—' }}</p>
                  <p class="text-[10px] text-slate-400 m-0">{{ 'disputes.details.seller' | translate }}</p>
                </div>
                @if (!isBuyer()) {
                  <span class="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold shrink-0">{{ 'disputes.details.you' | translate }}</span>
                }
              </div>
            </div>
            <div class="flex gap-2">
              @if (dispute()!.grossAmount) {
                <div class="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.escrow' | translate }}</p>
                  <p class="text-sm font-bold text-slate-900 m-0">{{ dispute()!.grossAmount | amount }}</p>
                </div>
              }
              @if (dispute()!.claimedAmount) {
                <div class="flex-1 bg-red-50 rounded-xl px-3 py-2">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-red-400 m-0 mb-0.5">{{ 'disputes.details.claimed' | translate }}</p>
                  <p class="text-sm font-bold text-red-700 m-0">{{ dispute()!.claimedAmount | amount }}</p>
                </div>
              }
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.transaction' | translate }}</p>
              <p class="text-xs font-mono text-slate-600 m-0 break-all">{{ dispute()!.transactionRef }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.openedAt' | translate }}</p>
              <p class="text-xs text-slate-600 m-0">{{ dispute()!.createdAt | timeAgo }}</p>
            </div>
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wide text-slate-400 m-0 mb-0.5">{{ 'disputes.details.reason' | translate }}</p>
              <p class="text-xs text-slate-700 m-0">{{ ('disputes.reasons.' + dispute()!.reason) | translate }}</p>
            </div>
          </div>
        } @else {
          <div class="px-4 py-4 space-y-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="skeleton-shimmer h-10 rounded-xl"></div>
            }
          </div>
        }

        <div class="border-t border-slate-100 mx-4 my-1"></div>
        <div class="px-4 py-3">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 m-0">{{ 'disputes.timeline.title' | translate }}</p>
        </div>
        <div class="px-4 pb-8">
          @for (step of statusTimeline(); track step.key; let isLast = $last) {
            <div class="relative flex gap-3 pb-4">
              @if (!isLast) {
                <div class="absolute left-2.75 top-6 bottom-0 w-0.5 rounded-full transition-colors"
                     [class.bg-primary]="step.state === 'completed'"
                     [class.bg-slate-200]="step.state !== 'completed'"></div>
              }
              <div class="w-6 h-6 rounded-full shrink-0 z-10 flex items-center justify-center text-[10px] font-bold transition-all"
                   [class.bg-primary]="step.state === 'current'"
                   [class.text-white]="step.state === 'current' || step.state === 'completed'"
                   [class.ring-4]="step.state === 'current'"
                   [class.ring-blue-100]="step.state === 'current'"
                   [class.bg-green-500]="step.state === 'completed'"
                   [class.bg-slate-100]="step.state === 'pending'"
                   [class.text-slate-400]="step.state === 'pending'">
                @if (step.state === 'completed') { ✓ }
                @else if (step.state === 'current') {
                  <span class="w-2 h-2 bg-white rounded-full block"></span>
                }
              </div>
              <div class="flex-1 min-w-0 pt-0.5">
                <p class="text-xs m-0 leading-tight"
                   [class.font-bold]="step.state === 'current'"
                   [class.text-primary]="step.state === 'current'"
                   [class.font-medium]="step.state === 'completed'"
                   [class.text-green-600]="step.state === 'completed'"
                   [class.text-slate-400]="step.state === 'pending'">
                  {{ step.labelKey | translate }}
                </p>
                @if (step.state === 'current') {
                  <p class="text-[10px] text-slate-400 m-0 mt-0.5">{{ 'disputes.timeline.inProgress' | translate }}</p>
                }
              </div>
            </div>
          }
        </div>

      </div><!-- end right column -->

    </div>

  `,
})
export class DisputeChatComponent implements OnInit, OnDestroy {

  protected readonly evidenceTypeOptions = [
    { value: 'IMAGE'      as const, icon: '🖼️', labelKey: 'disputes.evidence.types.IMAGE'      },
    { value: 'VIDEO'      as const, icon: '🎬', labelKey: 'disputes.evidence.types.VIDEO'      },
    { value: 'DOCUMENT'   as const, icon: '📄', labelKey: 'disputes.evidence.types.DOCUMENT'   },
    { value: 'SCREENSHOT' as const, icon: '📸', labelKey: 'disputes.evidence.types.SCREENSHOT' },
  ];

  private readonly route          = inject(ActivatedRoute);
  private readonly disputeService = inject(DisputeService);
  private readonly stomp          = inject(StompService);
  private readonly auth           = inject(AuthStore);
  private readonly toast          = inject(ToastService);
  private readonly translate      = inject(TranslateService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;

  protected readonly disputeId          = signal('');
  protected readonly dispute            = signal<DisputeResponse | null>(null);
  protected readonly messages           = signal<DisputeMessage[]>([]);
  protected readonly typingUsers        = signal<string[]>([]);
  protected readonly sending            = signal(false);
  protected readonly paying             = signal(false);
  protected readonly uploadingFile      = signal(false);
  protected readonly countdown          = signal('');
  protected readonly evidenceDialogOpen = signal(false);
  protected readonly pendingFile        = signal<File | null>(null);
  protected readonly evidenceType       = signal<'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'SCREENSHOT'>('IMAGE');
  protected readonly evidenceDesc       = signal('');

  protected messageText = '';

  private readonly localFileMap = new Map<string, File>();

  private messageSub?: StompSubscription;
  private statusSub?: StompSubscription;
  private typingSub?: StompSubscription;
  private typingTimeout?: ReturnType<typeof setTimeout>;
  private countdownInterval?: ReturnType<typeof setInterval>;
  private isNearBottomState = true;

  protected readonly deadlinePassed = computed(() => {
    const d = this.dispute()?.submissionDeadline;
    if (!d) return false;
    return new Date(d).getTime() <= Date.now();
  });

  protected readonly alreadyPaid = computed(() => {
    const d = this.dispute();
    if (!d) return false;
    return this.isBuyer() ? d.buyerArbitrationFeePaid : d.sellerArbitrationFeePaid;
  });

  protected readonly isTerminal = computed(() => {
    const s = this.dispute()?.status;
    return s === 'RESOLVED_BUYER' || s === 'RESOLVED_SELLER'
        || s === 'RESOLVED_SPLIT' || s === 'CLOSED_NO_ACTION' || s === 'CANCELLED';
  });

  private readonly TIMELINE_STEPS = [
    { key: 'OPENED',                       labelKey: 'status.OPENED' },
    { key: 'UNDER_REVIEW',                 labelKey: 'status.UNDER_REVIEW' },
    { key: 'AWAITING',                     labelKey: 'disputes.timeline.awaitingResponse' },
    { key: 'AWAITING_ARBITRATION_PAYMENT', labelKey: 'status.AWAITING_ARBITRATION_PAYMENT' },
    { key: 'REFERRED_TO_ARBITRATION',      labelKey: 'status.REFERRED_TO_ARBITRATION' },
    { key: 'RESOLVED',                     labelKey: 'disputes.timeline.resolved' },
  ];

  private statusToIndex(status: string): number {
    switch (status) {
      case 'OPENED':                        return 0;
      case 'UNDER_REVIEW':                  return 1;
      case 'AWAITING_BUYER':
      case 'AWAITING_SELLER':               return 2;
      case 'AWAITING_ARBITRATION_PAYMENT':  return 3;
      case 'REFERRED_TO_ARBITRATION':       return 4;
      default:                              return 5;
    }
  }

  protected readonly statusTimeline = computed((): TimelineStep[] => {
    const d = this.dispute();
    const currentIdx = d ? this.statusToIndex(d.status) : 0;
    return this.TIMELINE_STEPS.map((step, idx) => ({
      key: step.key,
      labelKey: step.labelKey,
      state: idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending',
    }));
  });

  protected terminalBannerClass(): string {
    const d = this.dispute();
    if (!d) return '';
    const rt = d.resolutionType;
    const iWon = (rt === 'FULL_REFUND_BUYER' && this.isBuyer())
              || (rt === 'PARTIAL_REFUND_BUYER' && this.isBuyer())
              || (rt === 'RELEASE_TO_SELLER' && !this.isBuyer());
    if (d.status === 'CLOSED_NO_ACTION') return 'bg-slate-100 text-slate-700 border border-slate-200';
    if (iWon) return 'bg-success-lt text-success border border-green-200';
    return 'bg-red-50 text-error border border-red-200';
  }

  protected terminalIcon(): string {
    const d = this.dispute();
    if (!d) return '';
    if (d.status === 'CLOSED_NO_ACTION') return '📁';
    if (d.status === 'RESOLVED_SPLIT') return '⚖️';
    const iWon = (['FULL_REFUND_BUYER', 'PARTIAL_REFUND_BUYER'].includes(d.resolutionType ?? '') && this.isBuyer())
              || (d.resolutionType === 'RELEASE_TO_SELLER' && !this.isBuyer());
    return iWon ? '🎉' : '😔';
  }

  protected terminalTitle(): string {
    const d = this.dispute();
    if (!d) return '';
    const rt = d.resolutionType;
    if (d.status === 'CLOSED_NO_ACTION') return 'disputes.arbitration.closedNoAction';
    if (d.status === 'RESOLVED_SPLIT') return 'disputes.arbitration.resolvedSplit';
    if (d.status === 'RESOLVED_BUYER') return 'disputes.arbitration.resolvedBuyer';
    if (d.status === 'RESOLVED_SELLER') return 'disputes.arbitration.resolvedSeller';
    return 'disputes.arbitration.resolvedBuyer';
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.disputeId.set(id);

    try {
      const detail = await firstValueFrom(this.disputeService.getDispute(id));
      this.dispute.set(detail);
      this.messages.set(detail.messages ?? []);
      setTimeout(() => this.scrollToBottom(), 100);
      this.startCountdown();

      await this.stomp.connect();

      this.messageSub = this.stomp.subscribe(`/topic/dispute.${id}`);
      this.stomp.on<DisputeMessage>(`/topic/dispute.${id}`)
        .subscribe(msg => {
          this.messages.update(m => [...m, msg]);
          setTimeout(() => { if (this.isNearBottomState) this.scrollToBottom(); }, 50);
        });

      this.statusSub = this.stomp.subscribe(`/topic/dispute.${id}.status`);
      this.stomp.on<DisputeStatusEvent>(`/topic/dispute.${id}.status`)
        .subscribe(() => {
          this.disputeService.getDispute(id).subscribe(d => {
            this.dispute.set(d);
            this.startCountdown();
          });
        });

      this.typingSub = this.stomp.subscribe(`/topic/dispute.${id}.typing`);
      this.stomp.on<{ userId: string; userName: string; typing: boolean }>(`/topic/dispute.${id}.typing`)
        .subscribe(event => {
          if (event.userId === this.auth.user()?.userId) return;
          this.typingUsers.update(users =>
            event.typing
              ? (users.includes(event.userName) ? users : [...users, event.userName])
              : users.filter(u => u !== event.userName)
          );
        });

    } catch {
      // handled by error interceptor toast
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimeout);
    clearInterval(this.countdownInterval);
    if (this.disputeId()) {
      try { this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false }); } catch { /* no-op */ }
    }
    this.messageSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.typingSub?.unsubscribe();
  }

  protected payArbitrationFee(): void {
    const id = this.disputeId();
    if (!id || this.paying()) return;
    this.paying.set(true);
    this.disputeService.submitArbitrationFee(id).subscribe({
      next: (updated) => {
        this.dispute.set(updated);
        this.paying.set(false);
        if (updated.status === 'REFERRED_TO_ARBITRATION') {
          this.toast.success(this.translate.instant('disputes.arbitration.referredToast'));
        }
      },
      error: () => this.paying.set(false),
    });
  }

  private startCountdown(): void {
    clearInterval(this.countdownInterval);
    const d = this.dispute();
    if (!d?.submissionDeadline || d.status !== 'AWAITING_ARBITRATION_PAYMENT') return;
    const tick = () => {
      const ms = new Date(d.submissionDeadline!).getTime() - Date.now();
      if (ms <= 0) {
        this.countdown.set('00j 00h 00m 00s');
        clearInterval(this.countdownInterval);
        return;
      }
      const days  = Math.floor(ms / 86_400_000);
      const hours = Math.floor((ms % 86_400_000) / 3_600_000);
      const mins  = Math.floor((ms % 3_600_000) / 60_000);
      const secs  = Math.floor((ms % 60_000) / 1_000);
      this.countdown.set(
        `${String(days).padStart(2,'0')}j ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`
      );
    };
    tick();
    this.countdownInterval = setInterval(tick, 1_000);
  }

  protected sendMessage(): void {
    const content = this.messageText.trim();
    if (!content || this.sending()) return;
    this.sending.set(true);
    try {
      this.stomp.publish(`/app/dispute/${this.disputeId()}/message`, { content, internalOnly: false });
      this.messageText = '';
      clearTimeout(this.typingTimeout);
      this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
      setTimeout(() => { this.isNearBottomState = false; this.scrollToBottom(); }, 50);
    } finally {
      this.sending.set(false);
    }
  }

  protected onTyping(): void {
    this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: true });
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stomp.publish(`/app/dispute/${this.disputeId()}/typing`, { typing: false });
    }, 2000);
  }

  protected onScroll(): void {
    const el = this.messagesContainer?.nativeElement;
    if (!el) return;
    this.isNearBottomState = (el.scrollTop + el.clientHeight) > (el.scrollHeight - 100);
  }

  protected isBuyer(): boolean {
    const d = this.dispute();
    const uid = this.auth.user()?.userId;
    if (!d || !uid) return false;
    return d.initiatorRole === 'BUYER'
      ? uid === d.initiatorId
      : uid !== d.initiatorId;
  }

  protected isOwnMessage(msg: DisputeMessage): boolean {
    const uid = this.auth.user()?.userId;
    return !!uid && String(msg.senderId) === String(uid);
  }

  private static readonly STAFF_ROLES = new Set(['SYSTEM', 'SUPPORT', 'ADMIN', 'SUPERVISOR']);

  protected isStaffMessage(msg: DisputeMessage): boolean {
    return msg.messageType === 'SYSTEM'
        || DisputeChatComponent.STAFF_ROLES.has(msg.senderRole?.toUpperCase());
  }

  protected openEvidenceDialog(): void {
    this.pendingFile.set(null);
    this.evidenceType.set('IMAGE');
    this.evidenceDesc.set('');
    this.evidenceDialogOpen.set(true);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toast.error(this.translate.instant('disputes.evidence.fileTooLarge'));
      return;
    }

    const auto: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'SCREENSHOT' =
      file.type.startsWith('image/') ? 'IMAGE' :
      file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT';

    this.pendingFile.set(file);
    this.evidenceType.set(auto);
    // keep the dialog open (already visible); description stays as-is
  }

  protected cancelEvidence(): void {
    this.evidenceDialogOpen.set(false);
    this.pendingFile.set(null);
    this.evidenceDesc.set('');
  }

  protected submitEvidence(): void {
    const file = this.pendingFile();
    if (!file || this.uploadingFile()) return;

    this.uploadingFile.set(true);
    this.disputeService.uploadEvidence(
      this.disputeId(), file, this.evidenceType(), this.evidenceDesc() || undefined,
    ).subscribe({
      next: () => {
        const msgId = `local-${Date.now()}`;
        this.localFileMap.set(msgId, file);
        this.messages.update(m => [...m, {
          id: msgId,
          disputeId: this.disputeId(),
          content: JSON.stringify({ name: file.name, size: file.size, mimeType: file.type }),
          senderId: this.auth.user()?.userId ?? '',
          senderName: this.auth.user()?.fullName ?? '',
          senderRole: 'USER',
          messageType: 'FILE',
          internalOnly: false,
          attachmentCount: 1,
          attachmentIds: null,
          createdAt: new Date().toISOString(),
        }]);
        setTimeout(() => this.scrollToBottom(), 50);
        this.toast.success(this.translate.instant('disputes.evidence.successToast'));
        this.uploadingFile.set(false);
        this.evidenceDialogOpen.set(false);
        this.pendingFile.set(null);
        this.evidenceDesc.set('');
      },
      error: () => {
        this.toast.error(this.translate.instant('disputes.evidence.errorToast'));
        this.uploadingFile.set(false);
      },
    });
  }

  protected parseFileContent(content: string): { name: string; size: number; mimeType: string } | null {
    try { return JSON.parse(content); } catch { return null; }
  }

  protected downloadFile(msg: DisputeMessage): void {
    const file = this.localFileMap.get(msg.id);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected fileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch { /* no-op */ }
  }
}
