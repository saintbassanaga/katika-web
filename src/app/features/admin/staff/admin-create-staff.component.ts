import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../admin.service';
import { ToastService } from '@core/notification/toast.service';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { UserAdminResponse } from '@shared/models/model';

function passwordsMatch(c: AbstractControl): ValidationErrors | null {
  return c.get('password')?.value === c.get('confirmPassword')?.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-admin-create-staff',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneInputComponent, TranslatePipe],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-40" (click)="cancel.emit()"></div>

    <!-- Modal -->
    <div class="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl max-w-md mx-auto max-h-[90vh] overflow-y-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
        <h2 class="text-base font-bold text-slate-900">{{ 'admin.staff.createTitle' | translate }}</h2>
        <button type="button" (click)="cancel.emit()"
          class="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-5 py-4 flex flex-col gap-4">

        <!-- Full name -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.fullName' | translate }}</label>
          <input type="text" formControlName="fullName"
            [placeholder]="'admin.staff.fullNamePh' | translate"
            class="px-3.5 py-3 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
            [class.border-red-400]="isInvalid('fullName')"
            [class.border-slate-200]="!isInvalid('fullName')" />
          @if (isInvalid('fullName')) {
            <p class="text-xs text-red-500">{{ 'admin.staff.fullNameError' | translate }}</p>
          }
        </div>

        <!-- Phone -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.phone' | translate }}</label>
          <app-phone-input formControlName="phone" />
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.email' | translate }}</label>
          <input type="email" formControlName="email"
            [placeholder]="'admin.staff.emailPh' | translate"
            class="px-3.5 py-3 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
            [class.border-red-400]="isInvalid('email')"
            [class.border-slate-200]="!isInvalid('email')" />
          @if (isInvalid('email')) {
            <p class="text-xs text-red-500">{{ 'admin.staff.emailError' | translate }}</p>
          }
        </div>

        <!-- Role -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.role' | translate }}</label>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
              [class.border-primary]="form.get('role')?.value === 'SUPPORT'"
              [class.bg-blue-50]="form.get('role')?.value === 'SUPPORT'"
              [class.border-slate-200]="form.get('role')?.value !== 'SUPPORT'"
              [class.bg-slate-50]="form.get('role')?.value !== 'SUPPORT'">
              <input type="radio" formControlName="role" value="SUPPORT" class="hidden" />
              <span class="text-sm font-semibold"
                [class.text-primary]="form.get('role')?.value === 'SUPPORT'"
                [class.text-slate-600]="form.get('role')?.value !== 'SUPPORT'">
                {{ 'admin.staff.roleSupport' | translate }}
              </span>
            </label>
            <label class="flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all"
              [class.border-primary]="form.get('role')?.value === 'SUPERVISOR'"
              [class.bg-blue-50]="form.get('role')?.value === 'SUPERVISOR'"
              [class.border-slate-200]="form.get('role')?.value !== 'SUPERVISOR'"
              [class.bg-slate-50]="form.get('role')?.value !== 'SUPERVISOR'">
              <input type="radio" formControlName="role" value="SUPERVISOR" class="hidden" />
              <span class="text-sm font-semibold"
                [class.text-primary]="form.get('role')?.value === 'SUPERVISOR'"
                [class.text-slate-600]="form.get('role')?.value !== 'SUPERVISOR'">
                {{ 'admin.staff.roleSupervisor' | translate }}
              </span>
            </label>
          </div>
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.password' | translate }}</label>
          <div class="relative">
            <input [type]="showPwd() ? 'text' : 'password'" formControlName="password"
              placeholder="Min. 8 car., 1 maj., 1 chiffre, 1 spécial"
              class="w-full px-3.5 py-3 pr-11 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
              [class.border-red-400]="isInvalid('password')"
              [class.border-slate-200]="!isInvalid('password')" />
            <button type="button" (click)="showPwd.set(!showPwd())"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              @if (showPwd()) {
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              } @else {
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>
          @if (isInvalid('password')) {
            <p class="text-xs text-red-500">{{ 'admin.staff.passwordError' | translate }}</p>
          }
        </div>

        <!-- Confirm password -->
        <div class="flex flex-col gap-1">
          <label class="text-[13px] font-semibold text-slate-700">{{ 'admin.staff.confirmPassword' | translate }}</label>
          <input [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword"
            placeholder="••••••••"
            class="px-3.5 py-3 border-2 rounded-xl text-sm bg-slate-50 outline-none transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(27,79,138,.08)]"
            [class.border-red-400]="form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched"
            [class.border-slate-200]="!(form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched)" />
          @if (form.errors?.['passwordMismatch'] && form.get('confirmPassword')?.touched) {
            <p class="text-xs text-red-500">{{ 'admin.staff.mismatchError' | translate }}</p>
          }
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1 pb-2">
          <button type="button" (click)="cancel.emit()"
            class="flex-1 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" [disabled]="form.invalid || loading()"
            class="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity">
            @if (loading()) {
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            } @else {
              {{ 'admin.staff.submit' | translate }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AdminCreateStaffComponent {
  readonly created = output<UserAdminResponse>();
  readonly cancel  = output<void>();

  private readonly fb           = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly toast        = inject(ToastService);
  private readonly translate    = inject(TranslateService);

  protected readonly loading  = signal(false);
  protected readonly showPwd  = signal(false);

  protected readonly form = this.fb.group({
    fullName:        ['', [Validators.required, Validators.minLength(3)]],
    phone:           ['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    role:            ['SUPPORT', Validators.required],
    password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  protected isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const v = this.form.value;
    this.adminService.createStaff({
      fullName:    v.fullName!,
      phoneNumber: v.phone!,
      email:       v.email!,
      role:        v.role as 'SUPPORT' | 'SUPERVISOR',
      password:    v.password!,
    }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toast.success(this.translate.instant('admin.staff.createdToast', { name: user.fullName }));
        this.created.emit(user);
      },
      error: () => this.loading.set(false),
    });
  }
}
