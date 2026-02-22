import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
    <div class="animate-pulse">
      @for (i of items(); track i) {
        <div class="bg-white rounded-2xl p-4 shadow-sm mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div class="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LoadingSkeletonComponent {
  readonly count = input<number>(3);

  protected items() {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
