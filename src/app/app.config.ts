import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { csrfInterceptor } from '@core/http/csrf.interceptor';
import { authInterceptor } from '@core/http/auth.interceptor';
import { offlineInterceptor } from '@core/http/offline.interceptor';
import { errorInterceptor } from '@core/http/error.interceptor';
import { AuthStore } from '@core/auth/auth.store';
import { TranslateService } from '@ngx-translate/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        offlineInterceptor,
        csrfInterceptor,
        authInterceptor,
        errorInterceptor,
      ]),
    ),
    provideTranslateService({ fallbackLang : 'en' }),
    ...provideTranslateHttpLoader({ prefix: '/i18n/' }),
    provideAppInitializer(() => {
      const translate = inject(TranslateService);
      const saved = (localStorage.getItem('katika_lang') as 'fr' | 'en') || 'fr';
      translate.use('fr');
      translate.use(saved);
      return inject(AuthStore).init();
    }),
  ],
};
