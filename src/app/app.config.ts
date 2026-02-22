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

import { routes } from './app.routes';
import { csrfInterceptor } from '@core/http/csrf.interceptor';
import { authInterceptor } from '@core/http/auth.interceptor';
import { offlineInterceptor } from '@core/http/offline.interceptor';
import { errorInterceptor } from '@core/http/error.interceptor';
import { AuthStore } from '@core/auth/auth.store';

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
    // Restore session on every page load (replaces deprecated APP_INITIALIZER)
    provideAppInitializer(() => inject(AuthStore).init()),
  ],
};
