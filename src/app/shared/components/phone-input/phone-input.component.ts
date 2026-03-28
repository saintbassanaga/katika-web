import { Component, ElementRef, HostListener, computed, forwardRef, inject, input, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AsYouType, parsePhoneNumber, CountryCode } from 'libphonenumber-js/min';
import { TuiIcon } from '@taiga-ui/core';

interface Country { code: CountryCode; name: string; dial: string; flag: string; placeholder: string; }

const COUNTRIES: Country[] = [
  { code: 'CM', name: 'Cameroun',           dial: '237', flag: '🇨🇲', placeholder: '677 123 456'    },
  { code: 'NG', name: 'Nigeria',            dial: '234', flag: '🇳🇬', placeholder: '0802 123 4567'  },
  { code: 'GH', name: 'Ghana',              dial: '233', flag: '🇬🇭', placeholder: '023 123 4567'   },
  { code: 'SN', name: 'Sénégal',            dial: '221', flag: '🇸🇳', placeholder: '70 123 45 67'   },
  { code: 'CI', name: "Côte d'Ivoire",      dial: '225', flag: '🇨🇮', placeholder: '01 23 45 67 89' },
  { code: 'CD', name: 'Congo (RDC)',         dial: '243', flag: '🇨🇩', placeholder: '099 123 4567'   },
  { code: 'CG', name: 'Congo-Brazzaville',  dial: '242', flag: '🇨🇬', placeholder: '06 123 4567'    },
  { code: 'GA', name: 'Gabon',              dial: '241', flag: '🇬🇦', placeholder: '06 03 12 34'    },
  { code: 'TD', name: 'Tchad',              dial: '235', flag: '🇹🇩', placeholder: '63 01 23 45'    },
  { code: 'CF', name: 'Centrafrique',       dial: '236', flag: '🇨🇫', placeholder: '70 01 23 45'    },
  { code: 'GQ', name: 'Guinée équatoriale', dial: '240', flag: '🇬🇶', placeholder: '222 123 456'    },
  { code: 'FR', name: 'France',             dial: '33',  flag: '🇫🇷', placeholder: '06 12 34 56 78' },
  { code: 'BE', name: 'Belgique',           dial: '32',  flag: '🇧🇪', placeholder: '0470 12 34 56'  },
  { code: 'GB', name: 'Royaume-Uni',        dial: '44',  flag: '🇬🇧', placeholder: '07400 123456'   },
  { code: 'US', name: 'États-Unis',         dial: '1',   flag: '🇺🇸', placeholder: '(201) 555-0123' },
];

const TZ_MAP: Record<string, CountryCode> = {
  'Africa/Douala': 'CM', 'Africa/Lagos': 'NG', 'Africa/Accra': 'GH',
  'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Kinshasa': 'CD',
  'Africa/Lubumbashi': 'CD', 'Africa/Brazzaville': 'CG', 'Africa/Libreville': 'GA',
  'Africa/Ndjamena': 'TD', 'Africa/Bangui': 'CF', 'Africa/Malabo': 'GQ',
  'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/London': 'GB',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US',
};

export function detectCountry(): Country {
  try {
    const tz   = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const code = TZ_MAP[tz];
    return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0];
  } catch {
    return COUNTRIES[0];
  }
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule, TuiIcon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputComponent), multi: true },
  ],
  styles: [`
    :host { display: block; position: relative; }

    .wrap {
      display: flex; align-items: center;
      border: 2px solid #E2E8F0; border-radius: 12px;
      background: #F8FAFC;
      transition: border-color .2s, box-shadow .2s;
    }
    .wrap:focus-within {
      border-color: #1B4F8A; background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }
    .wrap.disabled { opacity: .5; pointer-events: none; }

    .flag-btn {
      display: flex; align-items: center; gap: .35rem;
      padding: .8125rem .75rem .8125rem 1rem;
      background: none; border: none; border-right: 2px solid #E2E8F0;
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
      font-size: .9375rem; font-weight: 600; color: #334155;
      border-radius: 10px 0 0 10px;
      transition: background .15s;
    }
    .flag-btn:hover { background: rgba(0,0,0,.03); }

    .chevron { color: #94A3B8; transition: transform .2s; flex-shrink: 0; }
    .chevron.open { transform: rotate(180deg); }

    .input {
      flex: 1; padding: .8125rem .875rem;
      background: transparent; border: none; outline: none;
      font-size: .9375rem; color: #0F172A; font-family: inherit;
      letter-spacing: .03em;
    }
    .input::placeholder { color: #CBD5E1; }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px); left: 0;
      min-width: 230px;
      background: #fff;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,.1);
      padding: .375rem 0;
      z-index: 100;
      max-height: 260px;
      overflow-y: auto;
      list-style: none;
      margin: 0;
    }

    .option {
      display: flex; align-items: center; gap: .625rem;
      padding: .625rem 1rem;
      cursor: pointer; font-size: .875rem; color: #0F172A;
      transition: background .12s;
    }
    .option:hover { background: #F1F5F9; }
    .option.selected { background: #EBF4FF; font-weight: 600; }

    .option-name { flex: 1; }
    .option-dial { color: #64748B; font-size: .8125rem; }
  `],
  template: `
    <div class="wrap" [class.disabled]="isDisabled()">

      <button type="button" class="flag-btn"
              (click)="toggleDropdown()"
              [attr.aria-expanded]="open()"
              [disabled]="isDisabled()">
        <span>{{ country().flag }}</span>
        <span>+{{ country().dial }}</span>
        <tui-icon icon="@tui.chevron-down" class="chevron w-3 h-3" [class.open]="open()" />
      </button>

      @if (open()) {
        <ul class="dropdown" role="listbox">
          @for (c of countries; track c.code) {
            <li class="option" [class.selected]="c.code === country().code"
                role="option" (click)="select(c)">
              <span>{{ c.flag }}</span>
              <span class="option-name">{{ c.name }}</span>
              <span class="option-dial">+{{ c.dial }}</span>
            </li>
          }
        </ul>
      }

      <input
        type="tel"
        inputmode="tel"
        [placeholder]="resolvedPlaceholder()"
        [disabled]="isDisabled()"
        [ngModel]="displayValue()"
        (ngModelChange)="onInput($event)"
        (blur)="onTouched()"
        class="input"
        maxlength="20"
      />
    </div>
  `,
})
export class PhoneInputComponent implements ControlValueAccessor {
  readonly placeholder      = input<string | undefined>(undefined);
  readonly withCountryCode  = input<boolean>(true);
  readonly countryChange    = output<CountryCode>();

  protected readonly countries  = COUNTRIES;
  protected readonly country    = signal<Country>(detectCountry());
  protected readonly rawDigits  = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly open       = signal(false);

  protected readonly resolvedPlaceholder = computed(() =>
    this.placeholder() ?? this.country().placeholder
  );

  /** AsYouType formatted display value. */
  protected readonly displayValue = computed(() => {
    const digits = this.rawDigits();
    if (!digits) return '';
    return new AsYouType(this.country().code).input(digits);
  });

  private readonly el = inject(ElementRef);
  private onChange: (val: string) => void = () => {};
  protected onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected toggleDropdown(): void { this.open.update(v => !v); }

  protected select(c: Country): void {
    this.country.set(c);
    this.rawDigits.set('');
    this.open.set(false);
    this.onChange('');
    this.countryChange.emit(c.code);
  }

  protected onInput(value: string): void {
    const digits = value.replace(/\D/g, '');
    this.rawDigits.set(digits);
    if (!this.withCountryCode()) {
      this.onChange(digits);
      return;
    }
    try {
      const parsed = parsePhoneNumber(digits, this.country().code);
      this.onChange(parsed.format('E.164'));
    } catch {
      this.onChange(`+${this.country().dial}${digits}`);
    }
  }

  writeValue(value: string): void {
    if (!value) { this.rawDigits.set(''); return; }
    try {
      const parsed  = parsePhoneNumber(value);
      const code    = parsed.country;
      const country = code ? COUNTRIES.find(c => c.code === code) : undefined;
      if (country) this.country.set(country);
      this.rawDigits.set(parsed.nationalNumber as string);
    } catch {
      this.rawDigits.set(value.replace(/\D/g, ''));
    }
  }

  registerOnChange(fn: (val: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
