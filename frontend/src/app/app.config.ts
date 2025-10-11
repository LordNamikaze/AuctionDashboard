import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { ConfigLoaderService } from './services/config-loader-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    // ✅ Functional app initializer (Angular 20 syntax)
    provideAppInitializer(() => {
      const configService = inject(ConfigLoaderService);
      return configService.load();
    })
  ]
};