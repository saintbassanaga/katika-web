import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div
      class="bg-white rounded-2xl shadow-sm p-4"
      [class.p-0]="noPadding()"
      [class.cursor-pointer]="clickable()"
      [class.hover:shadow-md]="clickable()"
      [class.transition-shadow]="clickable()"
    >
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  readonly noPadding = input<boolean>(false);
  readonly clickable = input<boolean>(false);
}
