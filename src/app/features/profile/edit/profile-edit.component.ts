import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="min-h-[100svh] bg-page animate-fade">

      <!-- Top bar -->
      <div class="bg-dark px-5 py-4 flex items-center gap-3.5">
        <a routerLink="/profile" class="w-9 h-9 rounded-[10px] bg-white/10 border-none cursor-pointer flex items-center justify-center text-white no-underline shrink-0 transition-colors hover:bg-white/[.18]" aria-label="Retour">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </a>
        <span class="text-white text-base font-bold tracking-[-0.01em]">{{ 'profile.editForm.topbarTitle' | translate }}</span>
      </div>

      <div class="px-5 py-5 max-w-[560px] mx-auto">

        <!-- Avatar / identity card -->
        <div class="flex flex-col items-center bg-white rounded-[20px] px-6 pt-8 pb-6 mb-4 shadow-[0_1px_4px_rgba(15,23,42,.06)] animate-entry">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dk flex items-center justify-center text-white text-[1.75rem] font-bold mb-4 shadow-[0_6px_24px_rgba(27,79,138,.3)]">{{ auth.initials() }}</div>
          <p class="text-[1.125rem] font-bold text-slate-900 m-0 mb-[.2rem]">{{ auth.fullName() }}</p>
          <span class="text-xs font-bold uppercase tracking-[.07em] text-[#92680A] bg-gold-lt border border-[rgba(201,146,13,.2)] px-3 py-1 rounded-full">{{ auth.role() }}</span>
        </div>

        <!-- Read-only info -->
        <div class="bg-white rounded-[20px] overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,.06)] mb-4 animate-entry">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-page">
            <span class="text-[.8125rem] text-slate-400 font-medium">{{ 'profile.editForm.phone' | translate }}</span>
            <span class="flex items-center gap-1.5 text-xs text-slate-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              {{ 'profile.editForm.nonEditable' | translate }}
            </span>
          </div>
          <div class="flex items-center justify-between px-5 py-3.5">
            <span class="text-[.8125rem] text-slate-400 font-medium">{{ 'profile.editForm.role' | translate }}</span>
            <span class="text-sm text-slate-600 font-semibold">{{ auth.role() }}</span>
          </div>
        </div>

        <!-- Editable form -->
        <div class="bg-white rounded-[20px] p-6 shadow-[0_1px_4px_rgba(15,23,42,.06)] animate-entry">
          <p class="text-[.9375rem] font-bold text-slate-900 m-0 mb-5">{{ 'profile.editForm.editableSection' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <!-- Full name -->
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">{{ 'profile.fullName' | translate }}</label>
              <input type="text" formControlName="fullName"
                     [placeholder]="'profile.editForm.fullNamePh' | translate"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="isInvalid('fullName')" />
              @if (form.get('fullName')?.errors?.['required'] && form.get('fullName')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'profile.editForm.fullNameRequired' | translate }}</p>
              }
              @if (form.get('fullName')?.errors?.['minlength'] && form.get('fullName')?.touched) {
                <p class="text-xs text-error mt-1.5">{{ 'profile.editForm.fullNameMin' | translate }}</p>
              }
            </div>

            <!-- Email -->
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">
                {{ 'profile.email' | translate }} <span class="text-slate-400 font-normal">{{ 'common.optional' | translate }}</span>
              </label>
              <input type="email" formControlName="email"
                     [placeholder]="'auth.register.emailPh' | translate"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
                     [class.border-error]="isInvalid('email')" />
              @if (isInvalid('email')) {
                <p class="text-xs text-error mt-1.5">{{ 'profile.editForm.emailInvalid' | translate }}</p>
              }
              <p class="text-xs text-slate-400 mt-1.5">{{ 'profile.editForm.emailHint' | translate }}</p>
            </div>

            <!-- CNI number -->
            <div class="mb-[1.125rem]">
              <label class="block text-[.8125rem] font-semibold text-slate-700 mb-[.4rem] tracking-[.01em]">
                {{ 'profile.editForm.cni' | translate }} <span class="text-slate-400 font-normal">{{ 'common.optional' | translate }}</span>
              </label>
              <input type="text" formControlName="cniNumber" placeholder="123456789"
                     class="w-full px-4 py-[.8125rem] border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] box-border transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]" />
              <p class="text-xs text-slate-400 mt-1.5">{{ 'profile.editForm.cniHint' | translate }}</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-6">
              <a routerLink="/profile"
                 class="px-5 py-3.5 bg-page text-slate-600 text-[.9375rem] font-semibold border-none rounded-[14px] cursor-pointer font-[inherit] no-underline flex items-center justify-center transition-colors hover:bg-slate-200">
                {{ 'profile.editForm.cancel' | translate }}
              </a>
              <button type="submit"
                      class="flex-1 py-3.5 bg-gradient-to-br from-primary to-primary-dk text-white text-[.9375rem] font-bold border-none rounded-[14px] cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(27,79,138,.35)] font-[inherit] transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                      [disabled]="form.invalid || form.pristine || auth.loading()">
                @if (auth.loading()) {
                  <span class="w-[18px] h-[18px] border-[2.5px] border-white/35 border-t-white rounded-full animate-spin"></span>
                  {{ 'profile.editForm.saving' | translate }}
                } @else {
                  {{ 'profile.editForm.save' | translate }}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                }
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  protected readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    fullName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email:     ['', Validators.email],
    cniNumber: [''],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        fullName: user.fullName,
        email:    user.email ?? '',
      });
    }
  }

  protected isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.form.pristine) return;
    const v = this.form.value;
    this.auth.updateProfile({
      fullName:  v.fullName!,
      email:     v.email   || undefined,
      cniNumber: v.cniNumber || undefined,
    });
  }
}
