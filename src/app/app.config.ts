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
import {provideHttpClient, withInterceptors, withFetch} from '@angular/common/http';
import {provideTranslateService, TranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {firstValueFrom} from 'rxjs';

import {routes} from './app.routes';
import {csrfInterceptor} from '@core/http/csrf.interceptor';
import {authInterceptor} from '@core/http/auth.interceptor';
import {offlineInterceptor} from '@core/http/offline.interceptor';
import {errorInterceptor} from '@core/http/error.interceptor';
import {AuthStore} from '@core/auth/auth.store';

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
    provideTranslateService({fallbackLang: 'en'}),
    ...provideTranslateHttpLoader({prefix: '/i18n/', useHttpBackend: true}),
    provideAppInitializer(async () => {
      const translate = inject(TranslateService);
      const authStore = inject(AuthStore);
      const saved = (localStorage.getItem('katika_lang') as 'fr' | 'en') || 'fr';
      await firstValueFrom(translate.use(saved));
      return await authStore.init();
    }),
  ],
};
