import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { WA_ANIMATION_FRAME } from '@ng-web-apis/common';
import { NEVER } from 'rxjs';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideNoopAnimations(), // override provideAnimations() — pas de DOM en SSR
    // @ng-web-apis/common : requestAnimationFrame n'existe pas en Node.js
    { provide: WA_ANIMATION_FRAME, useValue: NEVER },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
