import {
  Component,
  input,
  output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>

      <!-- Sheet -->
      <div
        #sheet
        class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl
               shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        role="dialog"
        [attr.aria-label]="title()"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        @if (title()) {
          <div class="px-5 py-3 border-b border-gray-100">
            <h3 class="text-base font-semibold text-gray-900">{{ title() }}</h3>
          </div>
        }

        <div class="p-5">
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class BottomSheetComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly close = output<void>();

  @ViewChild('sheet') sheetRef?: ElementRef<HTMLElement>;
}
