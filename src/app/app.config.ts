import {
  ApplicationConfig,
  inject,
  isDevMode,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NG_EVENT_PLUGINS } from '@taiga-ui/event-plugins';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideServiceWorker } from '@angular/service-worker';
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
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    ...NG_EVENT_PLUGINS,
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
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10,   // 10 minutes
            retry: 1,
          },
        },
      }),
    ),
    provideTranslateService({fallbackLang: 'en'}),
    ...provideTranslateHttpLoader({prefix: '/i18n/', useHttpBackend: true}),
    provideAppInitializer(async () => {
      const translate = inject(TranslateService);
      const authStore = inject(AuthStore);
      const platformId = inject(PLATFORM_ID);

      if (!isPlatformBrowser(platformId)) {
        translate.setDefaultLang('fr');
        return;
      }

      const saved = (localStorage.getItem('katica_lang') as 'fr' | 'en') || 'fr';
      await firstValueFrom(translate.use(saved));
      return await authStore.init();
    }), provideClientHydration(withEventReplay()),
  ],
};
