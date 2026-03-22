// DOIT être le premier import — polyfille requestAnimationFrame avant @ng-web-apis/common
import './polyfills.server';

import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(App, config, context);

export default bootstrap;
