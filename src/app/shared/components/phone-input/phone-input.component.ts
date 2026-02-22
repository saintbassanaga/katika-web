import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  styles: [`
    .wrap {
      display: flex; align-items: center;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC;
      transition: border-color .2s, box-shadow .2s;
    }
    .wrap:focus-within {
      border-color: #1B4F8A;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }
    .wrap.disabled { opacity: .5; }
    .prefix {
      padding: .8125rem .875rem .8125rem 1rem;
      font-size: .9375rem; font-weight: 600; color: #334155;
      border-right: 2px solid #E2E8F0;
      white-space: nowrap; flex-shrink: 0;
      user-select: none;
    }
    .input {
      flex: 1; padding: .8125rem .875rem;
      background: transparent; border: none; outline: none;
      font-size: .9375rem; color: #0F172A; font-family: inherit;
    }
    .input::placeholder { color: #CBD5E1; }
  `],
  template: `
    <div class="wrap" [class.disabled]="isDisabled()">
      <span class="prefix">🇨🇲 +237</span>
      <input
        type="tel"
        inputmode="tel"
        [placeholder]="placeholder()"
        [disabled]="isDisabled()"
        [ngModel]="localValue()"
        (ngModelChange)="onInput($event)"
        (blur)="onTouched()"
        class="input"
        maxlength="15"
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
    const digits = value.replace(/\D/g, '');
    this.localValue.set(digits);
    this.onChange(digits);
  }

  writeValue(value: string): void {
    const digits = (value ?? '').replace(/^\+237/, '').replace(/\D/g, '');
    this.localValue.set(digits);
  }

  registerOnChange(fn: (val: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
