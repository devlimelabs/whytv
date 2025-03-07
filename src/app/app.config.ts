import { ApplicationConfig, inject, provideAppInitializer, provideExperimentalZonelessChangeDetection } from '@angular/core';
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
import { InactivityService } from './services/inactivity/inactivity.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideRouter(routes, withRouterConfig({ defaultQueryParamsHandling: 'replace', paramsInheritanceStrategy: 'always' }), withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(),
    provideAnimationsAsync(),
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
    provideAppInitializer(() => inject(InactivityService).startWatch())
  ]
};
