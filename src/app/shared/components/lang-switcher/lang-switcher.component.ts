import { Component, inject, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  styles: [`
    .switcher {
      display: flex; align-items: center; gap: 2px;
      background: rgba(255,255,255,.08); border-radius: 10px;
      color: rgba(226,232,240,.7);
      padding: 3px;
    }
    .lang-btn {
      padding: .25rem .625rem; border-radius: 7px;
      border: none; cursor: pointer; font-size: .75rem; font-weight: 700;
      letter-spacing: .04em; transition: background .15s, color .15s;
      font-family: inherit; background: none; color: rgba(148,163,184,.7);
    }
    .lang-btn.active {
      background: rgba(255,255,255,.15); color: #fff;
    }
    .lang-btn:hover:not(.active) { color: rgba(226,232,240,.8); }
  `],
  template: `
    <div class="switcher" role="group" aria-label="Language">
      <button class="lang-btn" [class.active]="current() === 'fr'"
              (click)="use('fr')">FR</button>
      <button class="lang-btn" [class.active]="current() === 'en'"
              (click)="use('en')">EN</button>
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
