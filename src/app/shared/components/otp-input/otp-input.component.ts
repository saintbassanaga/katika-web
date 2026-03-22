import {
  Component,
  effect,
  input,
  model,
  OnDestroy,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TuiTextfield } from '@taiga-ui/core';
import { TuiInputPin } from '@taiga-ui/kit';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [ReactiveFormsModule, TuiTextfield, TuiInputPin],
  template: `
    <tui-textfield class="otp-textfield">
      <input
        tuiInputPin
        [maxlength]="length()"
        [formControl]="pinControl"
      />
    </tui-textfield>
  `,
  styles: [`
    :host { display: block; }
    :host ::ng-deep tui-textfield { --tui-radius: 0.75rem; }
  `],
})
export class OtpInputComponent implements OnDestroy {
  readonly length    = input<number>(6);
  readonly disabled  = input<boolean>(false);
  readonly value     = model<string>('');
  readonly completed = output<string>();

  protected readonly pinControl = new FormControl('');

  private readonly sub: Subscription;

  constructor() {
    // Sync internal control → external model
    this.sub = this.pinControl.valueChanges.subscribe(v => {
      const val = v ?? '';
      this.value.set(val);
      if (val.length === this.length()) {
        this.completed.emit(val);
      }
    });

    // Sync disabled input → form control
    effect(() => {
      if (this.disabled()) {
        this.pinControl.disable({ emitEvent: false });
      } else {
        this.pinControl.enable({ emitEvent: false });
      }
    });

    // Sync external model → internal control (parent reset)
    effect(() => {
      const v = this.value();
      if (this.pinControl.value !== v) {
        this.pinControl.setValue(v, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  reset(): void {
    this.pinControl.setValue('', { emitEvent: false });
    this.value.set('');
  }
}
