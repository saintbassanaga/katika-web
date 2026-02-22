import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (src()) {
      <img
        [src]="src()"
        [alt]="alt()"
        [class]="sizeClass()"
        class="rounded-full object-cover"
      />
    } @else {
      <div
        [class]="sizeClass()"
        class="rounded-full flex items-center justify-center text-white font-bold"
        style="background:#1A56DB"
        [attr.aria-label]="alt()"
      >
        {{ initials() }}
      </div>
    }
  `,
})
export class AvatarComponent {
  readonly src = input<string>('');
  readonly name = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly alt = input<string>('Avatar');

  protected sizeClass = computed(() => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
    return sizes[this.size()];
  });

  protected initials = computed(() => {
    const parts = this.name().trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  });
}
