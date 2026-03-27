import { Component, ElementRef, inject, QueryList, signal, ViewChildren } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { AuthService } from '@core/auth/auth.service';
import { ToastService } from '@core/notification/toast.service';
import { firstValueFrom } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { injectVerificationStatusQuery, injectSubmitVerificationMutation } from '../profile.queries';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('newPassword')?.value === c.get('confirmPassword')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslatePipe, NgTemplateOutlet],
  template: `
    <div class="min-h-[100svh] bg-page animate-fade">

      <!-- Topbar -->
      <div class="bg-dark px-5 py-4 flex items-center gap-3.5">
        <a routerLink="/profile" class="w-9 h-9 rounded-[10px] bg-white/10 border-none cursor-pointer flex items-center justify-center text-white no-underline shrink-0 transition-colors hover:bg-white/[.18]" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <span class="text-white text-base font-bold tracking-[-0.01em]">{{ 'profile.securityForm.topbarTitle' | translate }}</span>
      </div>

      <div class="px-5 py-5 max-w-[560px] mx-auto animate-entry">

        <!-- ── Verification ─────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mb-2 ml-0.5">{{ 'profile.securityForm.verificationSection' | translate }}</p>

        @if (auth.isVerified()) {
          <!-- Verified -->
          <div class="bg-gradient-to-br from-success to-[#047857] rounded-[20px] px-6 py-4 flex items-center gap-3.5 mb-3">
            <div class="w-10 h-10 rounded-xl shrink-0 bg-white/[.18] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <p class="text-white text-sm font-semibold m-0">{{ 'profile.securityForm.verified' | translate }}</p>
              <p class="text-white/70 text-xs m-0 mt-[.1rem]">{{ 'profile.securityForm.verifiedSub' | translate }}</p>
            </div>
          </div>

        } @else if (verificationQuery.data()?.status === 'PENDING') {
          <!-- Pending -->
          <div class="bg-amber-50 border border-amber-200 rounded-[20px] px-6 py-4 flex items-center gap-3.5 mb-3">
            <div class="w-10 h-10 rounded-xl shrink-0 bg-amber-100 flex items-center justify-center">
              <span class="w-5 h-5 border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin"></span>
            </div>
            <div>
              <p class="text-amber-900 text-sm font-semibold m-0">{{ 'profile.securityForm.pendingStatus' | translate }}</p>
              <p class="text-amber-600 text-xs m-0 mt-[.1rem]">{{ 'profile.securityForm.pendingSub' | translate }}</p>
            </div>
          </div>

        } @else if (verificationQuery.data()?.status === 'UNDER_REVIEW') {
          <!-- Under review -->
          <div class="bg-blue-50 border border-blue-200 rounded-[20px] px-6 py-4 flex items-center gap-3.5 mb-3">
            <div class="w-10 h-10 rounded-xl shrink-0 bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <p class="text-blue-900 text-sm font-semibold m-0">{{ 'profile.securityForm.underReviewStatus' | translate }}</p>
              <p class="text-blue-600 text-xs m-0 mt-[.1rem]">{{ 'profile.securityForm.underReviewSub' | translate }}</p>
            </div>
          </div>

        } @else if (verificationQuery.data()?.status === 'REJECTED') {
          <!-- Rejected — can resubmit -->
          <div class="bg-red-50 border border-red-200 rounded-[20px] px-6 py-4 mb-3">
            <div class="flex items-center gap-3.5 mb-0" [class.mb-0]="!showVerifyForm()" [class.mb-3]="showVerifyForm()">
              <div class="w-10 h-10 rounded-xl shrink-0 bg-red-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-red-900 text-sm font-semibold m-0">{{ 'profile.securityForm.rejectedStatus' | translate }}</p>
                @if (verificationQuery.data()?.rejectionReason) {
                  <p class="text-red-500 text-xs m-0 mt-[.1rem]">{{ verificationQuery.data()!.rejectionReason }}</p>
                }
              </div>
              <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-red-100 text-red-700 text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-red-200"
                      (click)="toggleVerifyForm()">
                {{ showVerifyForm() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.verifyBtn' | translate) }}
              </button>
            </div>
            @if (showVerifyForm()) {
              <ng-container *ngTemplateOutlet="verifyForm" />
            }
          </div>

        } @else {
          <!-- No request yet -->
          <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-3">
            <div class="flex items-center gap-3.5 px-6 py-4">
              <div class="w-10 h-10 rounded-xl shrink-0 bg-primary-lt flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-slate-900 text-sm font-semibold m-0">{{ 'profile.securityForm.notVerified' | translate }}</p>
                <p class="text-slate-400 text-xs m-0 mt-[.1rem]">{{ 'profile.securityForm.notVerifiedSub' | translate }}</p>
              </div>
              <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary-lt text-primary text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-[#C8DCF2]"
                      (click)="toggleVerifyForm()">
                {{ showVerifyForm() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.verifyBtn' | translate) }}
              </button>
            </div>

            @if (showVerifyForm()) {
              <div class="px-6 pb-5 border-t border-page animate-slide-down">
                <ng-container *ngTemplateOutlet="verifyForm" />
              </div>
            }
          </div>
        }

        <!-- ── Shared upload form template ── -->
        <ng-template #verifyForm>
          <div class="mt-4 space-y-4">
            <!-- Bill 1 -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">
                {{ 'profile.securityForm.bill1Label' | translate }}
                <span class="text-error ml-1">*</span>
              </label>
              <label class="flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                     [class]="bill1() ? 'border-success bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-primary'">
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="sr-only" (change)="onFileChange($event, 'bill1')" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="bill1() ? '#10B981' : '#94A3B8'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span class="text-[.8125rem]" [class]="bill1() ? 'text-success font-medium' : 'text-slate-400'">
                  {{ bill1() ? bill1()!.name : ('profile.securityForm.filePh' | translate) }}
                </span>
              </label>
              <p class="text-[.6875rem] text-slate-400 mt-1">{{ 'profile.securityForm.fileHint' | translate }}</p>
            </div>

            <!-- Bill 2 -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">
                {{ 'profile.securityForm.bill2Label' | translate }}
                <span class="text-error ml-1">*</span>
              </label>
              <label class="flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
                     [class]="bill2() ? 'border-success bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-primary'">
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="sr-only" (change)="onFileChange($event, 'bill2')" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="bill2() ? '#10B981' : '#94A3B8'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span class="text-[.8125rem]" [class]="bill2() ? 'text-success font-medium' : 'text-slate-400'">
                  {{ bill2() ? bill2()!.name : ('profile.securityForm.filePh' | translate) }}
                </span>
              </label>
              <p class="text-[.6875rem] text-slate-400 mt-1">{{ 'profile.securityForm.fileHint' | translate }}</p>
            </div>

            <!-- Notes (optional) -->
            <div>
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">
                {{ 'profile.securityForm.notesLabel' | translate }}
                <span class="text-slate-400 font-normal ml-1">{{ 'common.optional' | translate }}</span>
              </label>
              <textarea rows="2"
                        [placeholder]="'profile.securityForm.notesPh' | translate"
                        [value]="verifyNotes()"
                        (input)="verifyNotes.set($any($event.target).value)"
                        class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.875rem] text-slate-900 outline-none font-[inherit] resize-y min-h-[60px] transition-all focus:border-primary focus:bg-white box-border"></textarea>
            </div>

            <!-- Submit -->
            <button type="button"
                    (click)="submitVerification()"
                    [disabled]="!bill1() || !bill2() || verificationMutation.isPending()"
                    class="w-full py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dk text-white text-sm font-bold border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(27,79,138,.3)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              @if (verificationMutation.isPending()) {
                <span class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                {{ 'profile.securityForm.submitting' | translate }}
              } @else {
                {{ 'profile.securityForm.submitVerify' | translate }}
              }
            </button>
          </div>
        </ng-template>

        <!-- ── Password ─────────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.securityForm.passwordSection' | translate }}</p>
        <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-3">
          <div class="flex items-center gap-3.5 px-5 py-4">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#FFF7ED] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.securityForm.passwordLabel' | translate }}</p>
              <p class="text-xs text-slate-400 mt-[.1rem] m-0">{{ 'profile.securityForm.lastChanged' | translate }}</p>
            </div>
            <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary-lt text-primary text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-[#C8DCF2]"
                    (click)="togglePwdForm()">
              {{ showPwdForm() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.modify' | translate) }}
            </button>
          </div>

          @if (showPwdForm()) {
            <div class="px-5 pb-5 border-t border-page animate-slide-down">
              <form [formGroup]="pwdForm" (ngSubmit)="changePassword()">

                <div class="mb-4 mt-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.currentPassword' | translate }}</label>
                  <div class="relative">
                    <input [type]="showCurrent() ? 'text' : 'password'" formControlName="currentPassword" placeholder="••••••••"
                           class="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                           [class.border-error]="isInvalidPwd('currentPassword')" />
                    <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600" (click)="showCurrent.set(!showCurrent())">
                      @if (showCurrent()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (isInvalidPwd('currentPassword')) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.currentPasswordRequired' | translate }}</p>
                  }
                </div>

                <div class="mb-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.newPassword' | translate }}</label>
                  <div class="relative">
                    <input [type]="showNew() ? 'text' : 'password'" formControlName="newPassword"
                           [placeholder]="'profile.securityForm.passwordPh' | translate"
                           class="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                           [class.border-error]="isInvalidPwd('newPassword')" />
                    <button type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-slate-400 p-1 flex items-center transition-colors hover:text-slate-600" (click)="showNew.set(!showNew())">
                      @if (showNew()) { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> } @else { <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                    </button>
                  </div>
                  @if (pwdForm.get('newPassword')?.errors?.['minlength'] && pwdForm.get('newPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordMin' | translate }}</p>
                  }
                  @if (pwdForm.get('newPassword')?.errors?.['pattern'] && pwdForm.get('newPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordStrong' | translate }}</p>
                  }
                </div>

                <div class="mb-4">
                  <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem]">{{ 'profile.securityForm.confirmPassword' | translate }}</label>
                  <input [type]="showNew() ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••"
                         class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                         [class.border-error]="pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched" />
                  @if (pwdForm.errors?.['mismatch'] && pwdForm.get('confirmPassword')?.touched) {
                    <p class="text-xs text-error mt-1.5">{{ 'profile.securityForm.passwordMismatch' | translate }}</p>
                  }
                </div>

                <div class="flex gap-2.5 mt-[1.125rem]">
                  <button type="button" class="px-[1.125rem] py-3 rounded-xl bg-page text-slate-500 text-sm font-semibold border-none cursor-pointer font-[inherit] transition-colors hover:bg-slate-200"
                          (click)="togglePwdForm()">{{ 'profile.securityForm.cancel' | translate }}</button>
                  <button type="submit"
                          class="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-dk text-white text-sm font-bold border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(27,79,138,.3)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          [disabled]="pwdForm.invalid || pwdLoading()">
                    @if (pwdLoading()) {
                      <span class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                      {{ 'profile.securityForm.changing' | translate }}
                    } @else {
                      {{ 'profile.securityForm.changePassword' | translate }}
                    }
                  </button>
                </div>
              </form>
            </div>
          }
        </div>

        <!-- ── 2FA ──────────────────────────────── -->
        <p class="text-[.6875rem] font-bold uppercase tracking-[.08em] text-slate-400 mt-5 mb-2 ml-0.5">{{ 'profile.securityForm.mfaSection' | translate }}</p>
        <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-3">
          <div class="flex items-center gap-3.5 px-5 py-4">
            <div class="w-[38px] h-[38px] rounded-[11px] bg-[#F0FDF4] shrink-0 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-900 m-0">{{ 'profile.securityForm.mfaLabel' | translate }}</p>
              <p class="text-xs mt-[.1rem] m-0" [style.color]="auth.hasMfa() ? '#16A34A' : '#94A3B8'">
                {{ auth.hasMfa() ? ('profile.securityForm.mfaEnabled' | translate) : ('profile.securityForm.mfaDisabled' | translate) }}
              </p>
            </div>
            @if (auth.hasMfa()) {
              <button class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-error-lt text-error text-[.8125rem] font-bold border-none cursor-pointer font-[inherit] transition-colors hover:bg-red-100"
                      (click)="toggleMfaDisable()">
                {{ showMfaDisable() ? ('profile.securityForm.cancel' | translate) : ('profile.securityForm.disable' | translate) }}
              </button>
            } @else {
              <a routerLink="/profile/security/mfa" class="ml-auto shrink-0 px-3.5 py-1.5 rounded-lg bg-primary-lt text-primary text-[.8125rem] font-bold no-underline transition-colors hover:bg-[#C8DCF2]">{{ 'profile.securityForm.enable' | translate }}</a>
            }
          </div>

          @if (showMfaDisable()) {
            <div class="px-5 pb-5 border-t border-page animate-slide-down">
              <p class="text-[.8125rem] text-slate-500 m-0 mt-4 mb-3.5">{{ 'profile.securityForm.disablePrompt' | translate }}</p>
              <div class="flex gap-2">
                @for (i of [0,1,2,3,4,5]; track i) {
                  <input #mfaCell type="text" inputmode="numeric" maxlength="1"
                         class="otp-cell w-11 h-[52px] text-center border-2 border-slate-200 rounded-xl bg-slate-50 text-[1.25rem] font-bold text-slate-900 outline-none font-[inherit] transition-all focus:border-error focus:shadow-[0_0_0_4px_rgba(220,38,38,.08)]"
                         (input)="onMfaCellInput($event, i)"
                         (keydown)="onMfaCellKeydown($event, i)" />
                }
              </div>
              <div class="flex gap-2.5 mt-3.5">
                <button type="button" class="px-[1.125rem] py-3 rounded-xl bg-page text-slate-500 text-sm font-semibold border-none cursor-pointer font-[inherit] transition-colors hover:bg-slate-200"
                        (click)="toggleMfaDisable()">{{ 'profile.securityForm.cancel' | translate }}</button>
                <button type="button"
                        class="flex-1 py-3 rounded-xl bg-gradient-to-br from-error to-[#B91C1C] text-white text-sm font-bold border-none cursor-pointer font-[inherit] flex items-center justify-center gap-2 shadow-[0_3px_12px_rgba(220,38,38,.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        [disabled]="mfaCode().length < 6 || mfaLoading()"
                        (click)="disableMfa()">
                  @if (mfaLoading()) {
                    <span class="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin"></span>
                    {{ 'profile.securityForm.disabling' | translate }}
                  } @else {
                    {{ 'profile.securityForm.confirmDisable' | translate }}
                  }
                </button>
              </div>
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class SecuritySettingsComponent {
  protected readonly auth       = inject(AuthStore);
  private  readonly authService = inject(AuthService);
  private  readonly toast       = inject(ToastService);
  private  readonly fb          = inject(FormBuilder);
  private  readonly translate   = inject(TranslateService);

  @ViewChildren('mfaCell') private readonly mfaCells!: QueryList<ElementRef<HTMLInputElement>>;

  /* ── UI state ── */
  protected readonly showPwdForm       = signal(false);
  protected readonly showMfaDisable    = signal(false);
  protected readonly showCurrent       = signal(false);
  protected readonly showNew           = signal(false);
  protected readonly pwdLoading        = signal(false);
  protected readonly mfaLoading        = signal(false);
  protected readonly mfaCode           = signal('');

  /* ── Verification ── */
  protected readonly verificationQuery   = injectVerificationStatusQuery();
  protected readonly verificationMutation = injectSubmitVerificationMutation();
  protected readonly showVerifyForm      = signal(false);
  protected readonly bill1               = signal<File | null>(null);
  protected readonly bill2               = signal<File | null>(null);
  protected readonly verifyNotes         = signal('');

  /* ── Password form ── */
  protected readonly pwdForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/),
    ]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  protected isInvalidPwd(f: string): boolean {
    const c = this.pwdForm.get(f);
    return !!(c?.invalid && c?.touched);
  }

  protected togglePwdForm(): void {
    this.showPwdForm.update(v => !v);
    if (!this.showPwdForm()) this.pwdForm.reset();
  }

  protected async changePassword(): Promise<void> {
    if (this.pwdForm.invalid) { this.pwdForm.markAllAsTouched(); return; }
    this.pwdLoading.set(true);
    try {
      await firstValueFrom(this.authService.changePassword({
        currentPassword: this.pwdForm.value.currentPassword!,
        newPassword:     this.pwdForm.value.newPassword!,
        confirmPassword:     this.pwdForm.value.confirmPassword!,
      }));
      this.toast.success(this.translate.instant('toast.passwordChanged'));
      this.togglePwdForm();
    } finally {
      this.pwdLoading.set(false);
    }
  }

  /* ── MFA disable ── */
  protected toggleMfaDisable(): void {
    this.showMfaDisable.update(v => !v);
    this.mfaCode.set('');
  }

  protected onMfaCellInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    input.value = val;

    const cells = this.mfaCells.toArray().map(r => r.nativeElement);
    if (val && index < 5) cells[index + 1]?.focus();

    this.mfaCode.set(cells.map(c => c.value).join(''));
  }

  protected onMfaCellKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const cells = this.mfaCells.toArray().map(r => r.nativeElement);
      if (!(event.target as HTMLInputElement).value && index > 0) {
        cells[index - 1].value = '';
        cells[index - 1].focus();
      }
      this.mfaCode.set(cells.map(c => c.value).join(''));
    }
  }

  protected async disableMfa(): Promise<void> {
    this.mfaLoading.set(true);
    try {
      await firstValueFrom(this.authService.disableMfa(this.mfaCode()));
      this.toast.success(this.translate.instant('toast.mfaDisabled'));
      this.toggleMfaDisable();
      const user = await firstValueFrom(this.authService.getMe());
      this.auth.updateUser(user);
    } catch {
      this.toast.error(this.translate.instant('toast.invalidCode'));
    } finally {
      this.mfaLoading.set(false);
    }
  }

  /* ── Verification ── */
  protected onFileChange(event: Event, field: 'bill1' | 'bill2'): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    field === 'bill1' ? this.bill1.set(file) : this.bill2.set(file);
  }

  protected toggleVerifyForm(): void {
    this.showVerifyForm.update(v => !v);
    if (!this.showVerifyForm()) {
      this.bill1.set(null);
      this.bill2.set(null);
      this.verifyNotes.set('');
    }
  }

  protected submitVerification(): void {
    const b1 = this.bill1();
    const b2 = this.bill2();
    if (!b1 || !b2) return;
    this.verificationMutation.mutate(
      { bill1: b1, bill2: b2, notes: this.verifyNotes() || undefined },
      {
        onSuccess: () => {
          this.showVerifyForm.set(false);
          this.bill1.set(null);
          this.bill2.set(null);
          this.verifyNotes.set('');
          this.toast.success(this.translate.instant('toast.verificationSent'));
        },
      },
    );
  }
}
