import { Component, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  template: `
    <div
      class="relative flex items-center bg-black/8 backdrop-blur-[6px] rounded-[11px] p-0.75 select-none"
      role="group"
      aria-label="Language"
    >
      <!-- Sliding pill indicator -->
      <div
        class="absolute top-0.75 bottom-0.75 left-0.75 w-[calc(50%-3px)] rounded-lg bg-white shadow-[0_1px_4px_rgba(0,0,0,.13),0_0_0_0.5px_rgba(0,0,0,.07)] pointer-events-none"
        style="transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
        [style.transform]="current() === 'en' ? 'translateX(100%)' : 'translateX(0)'"
      ></div>

      <!-- FR -->
      <button
        (click)="use('fr')"
        class="relative z-10 w-1/2 flex items-center justify-center gap-1 py-1.25 px-3 rounded-lg border-none bg-transparent cursor-pointer font-bold text-[11px] tracking-[.06em]"
        style="font-family: inherit; transition: opacity 0.2s"
        [style.color]="current() === 'fr' ? '#0f172a' : 'inherit'"
        [style.opacity]="current() === 'fr' ? '1' : '0.45'"
        aria-pressed="true"
      >
        <span style="font-size:13px;line-height:1">🇫🇷</span>
        <span>FR</span>
      </button>

      <!-- EN -->
      <button
        (click)="use('en')"
        class="relative z-10 w-1/2 flex items-center justify-center gap-1 py-1.25 px-3 rounded-lg border-none bg-transparent cursor-pointer font-bold text-[11px] tracking-[.06em]"
        style="font-family: inherit; transition: opacity 0.2s"
        [style.color]="current() === 'en' ? '#0f172a' : 'inherit'"
        [style.opacity]="current() === 'en' ? '1' : '0.45'"
        aria-pressed="undefined"
      >
        <span style="font-size:13px;line-height:1">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  `,
})
export class LangSwitcherComponent {
  private readonly translate = inject(TranslateService);
  protected readonly current = signal<string>(
    localStorage.getItem('katika_lang') || 'fr',
  );

  use(lang: 'fr' | 'en'): void {
    this.translate.use(lang);
    this.current.set(lang);
    localStorage.setItem('katika_lang', lang);
  }
}
