import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpConfigInterceptor } from './interceptors/http-config.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),

    // ✅ HttpClient + interceptors support
    provideHttpClient(
      withFetch(),
      withInterceptorsFromDi()
    ),

    // ✅ TON INTERCEPTOR GLOBAL
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpConfigInterceptor,
      multi: true
    }
  ]
};