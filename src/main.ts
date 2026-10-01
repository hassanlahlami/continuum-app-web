import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authConfig } from './app/auth/auth.config';
import { authInterceptor } from './app/auth/auth.interceptor';

/**
 * Amorçage de la Plateforme Fonctionnelle (§4.2, composants standalone) : HTTP + intercepteur de
 * jeton, routage, et client OIDC (configuration + tentative de connexion au démarrage, §4.5).
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideOAuthClient(),
    provideAppInitializer(() => {
      const oauth = inject(OAuthService);
      oauth.configure(authConfig);
      return oauth.loadDiscoveryDocumentAndTryLogin();
    }),
  ],
}).catch((err) => console.error(err));
