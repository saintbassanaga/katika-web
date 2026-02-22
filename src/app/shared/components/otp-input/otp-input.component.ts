import {
  Component,
  ElementRef,
  input,
  model,
  output,
  QueryList,
  ViewChildren,
  AfterViewInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex gap-2 justify-center" (paste)="onPaste($event)">
      @for (cell of cells; track $index; let i = $index) {
        <input
          #cellInput
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="1"
          [value]="values[i]"
          [disabled]="disabled()"
          (input)="onInput($event, i)"
          (keydown)="onKeydown($event, i)"
          (focus)="onFocus(i)"
          class="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200
                 rounded-xl bg-white focus:border-primary focus:outline-none
                 transition-colors caret-transparent"
          [class.border-primary]="values[i]"
          [attr.aria-label]="'Chiffre ' + (i + 1)"
        />
      }
    </div>
  `,
  styles: [`
    .border-primary { border-color: #1A56DB; }
    .focus\\:border-primary:focus { border-color: #1A56DB; }
  `],
})
export class OtpInputComponent implements AfterViewInit {
  readonly length = input<number>(6);
  readonly disabled = input<boolean>(false);
  readonly value = model<string>('');
  readonly completed = output<string>();

  @ViewChildren('cellInput') cellInputs!: QueryList<ElementRef<HTMLInputElement>>;

  protected values: string[] = [];
  protected cells: number[] = [];

  ngAfterViewInit(): void {
    this.cells = Array.from({ length: this.length() }, (_, i) => i);
    this.values = Array(this.length()).fill('');
    // Focus first cell
    setTimeout(() => this.cellInputs.first?.nativeElement.focus(), 100);
  }

  protected onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.values[index] = val;
    input.value = val;

    if (val && index < this.length() - 1) {
      this.focusCell(index + 1);
    }

    this.emitValue();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (this.values[index]) {
        this.values[index] = '';
        (event.target as HTMLInputElement).value = '';
      } else if (index > 0) {
        this.values[index - 1] = '';
        this.focusCell(index - 1);
        const prevEl = this.cellInputs.toArray()[index - 1]?.nativeElement;
        if (prevEl) prevEl.value = '';
      }
      this.emitValue();
    }
  }

  protected onFocus(index: number): void {
    // Select content on focus for easy replacement
    const el = this.cellInputs.toArray()[index]?.nativeElement;
    if (el) el.select();
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, this.length());

    digits.split('').forEach((char, i) => {
      this.values[i] = char;
      const el = this.cellInputs.toArray()[i]?.nativeElement;
      if (el) el.value = char;
    });

    // Focus last filled or next empty
    const nextIndex = Math.min(digits.length, this.length() - 1);
    this.focusCell(nextIndex);
    this.emitValue();
  }

  private focusCell(index: number): void {
    const el = this.cellInputs.toArray()[index]?.nativeElement;
    el?.focus();
  }

  private emitValue(): void {
    const code = this.values.join('');
    this.value.set(code);
    if (code.length === this.length()) {
      this.completed.emit(code);
    }
  }

  reset(): void {
    this.values = Array(this.length()).fill('');
    this.cellInputs.forEach(el => (el.nativeElement.value = ''));
    this.value.set('');
    this.focusCell(0);
  }
}
