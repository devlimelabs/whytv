import { ApplicationConfig, provideAppInitializer, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withRouterConfig, withViewTransitions } from '@angular/router';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { environment } from '../environments/environment';
import WhyTvTheme from '../whytv.theme';
import { routes } from './app.routes';
import { loadChannels } from './services/channel/channel.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' }), withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(),
    providePrimeNG({
      theme: {
        preset: WhyTvTheme,
        options: {
          mode: 'dark',
          darkModeSelector: '.dark-mode'
        }
      },
      zIndex: {
        modal: 1000,    // dialog, sidebar
        overlay: 1100,  // dropdown, overlay
        menu: 1000,     // dropdown, menu
        tooltip: 1100,  // tooltip
      }
    }),
    MessageService,
    provideAppInitializer(loadChannels)
  ]
};
