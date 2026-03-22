import { Component, input, computed } from '@angular/core';
import { TuiAvatar } from '@taiga-ui/kit';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [TuiAvatar],
  template: `
    <tui-avatar
      [src]="src() || initials()"
      [size]="tuiSize()"
      [style]="'--tui-background-accent-1: #1B4F8A'"
    />
  `,
})
export class AvatarComponent {
  readonly src  = input<string>('');
  readonly name = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly alt  = input<string>('Avatar');

  protected initials = computed(() => {
    const parts = this.name().trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  });

  protected tuiSize = computed((): 'xs' | 's' | 'm' | 'l' | 'xl' => {
    const map = { sm: 's', md: 'm', lg: 'l' } as const;
    return map[this.size()];
  });
}
