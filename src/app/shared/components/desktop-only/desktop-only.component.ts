import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-desktop-only',
  standalone: true,
  imports: [RouterLink, TranslatePipe, TuiIcon],
  template: `
    <div class="animate-fade flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gray-50">
      <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <tui-icon icon="@tui.monitor" class="w-10 h-10 text-indigo-600" />
      </div>

      <h1 class="text-2xl font-black text-gray-900 mb-3">
        {{ 'admin.dashboard.desktopOnly.title' | translate }}
      </h1>

      <p class="text-gray-500 mb-8 max-w-sm leading-relaxed">
        {{ 'admin.dashboard.desktopOnly.message' | translate }}
      </p>

      <a
        routerLink="/dashboard"
        class="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold
               hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
      >
        <tui-icon icon="@tui.arrow-left" class="w-4 h-4" />
        {{ 'admin.dashboard.desktopOnly.back' | translate }}
      </a>
    </div>
  `,
})
export class DesktopOnlyComponent {}
