import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-center border-2 border-gray-200 rounded-xl
                bg-white focus-within:border-blue-600 transition-colors"
         [class.opacity-50]="isDisabled()">
      <span class="pl-4 pr-2 py-3 text-gray-600 font-medium text-sm border-r border-gray-200 shrink-0">
        🇨🇲 +237
      </span>
      <input
        type="tel"
        inputmode="tel"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [ngModel]="localValue()"
        (ngModelChange)="onInput($event)"
        (blur)="onTouched()"
        class="flex-1 px-3 py-3 text-sm bg-transparent outline-none text-gray-900
               placeholder-gray-400"
        maxlength="9"
      />
    </div>
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('6XX XXX XXX');

  protected readonly localValue = signal('');
  protected readonly isDisabled = signal(false);

  private onChange: (val: string) => void = () => {};
  protected onTouched: () => void = () => {};

  protected onInput(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    this.localValue.set(digits);
    this.onChange(`+237${digits}`);
  }

  writeValue(value: string): void {
    const digits = (value ?? '').replace(/^\+237/, '').replace(/\D/g, '');
    this.localValue.set(digits);
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
