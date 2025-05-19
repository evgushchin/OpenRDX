import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from "@angular/core";
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from "@angular/router";
import {HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {ConfirmationService, MessageService} from 'primeng/api';
import {providePrimeNG} from 'primeng/config';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {createTranslateLoader} from './shared/loaders/translation.loader';
import {routes} from './app.routes';
import {CoreModule} from './core/core.module';
import AppPreset from './app.theme';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    ConfirmationService,
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: AppPreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: false,
        },
      },
    }),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi(),
    ),
    importProvidersFrom(CoreModule),
    importProvidersFrom([TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    })]),
  ],
}
