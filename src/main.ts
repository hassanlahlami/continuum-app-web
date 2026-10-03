import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { OAuthService, provideOAuthClient } from 'angular-oauth2-oidc';
import { BASE_PATH } from '../libs/api-clients/me';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authConfig } from './app/auth/auth.config';
import { authInterceptor } from './app/auth/auth.interceptor';
import { errorInterceptor } from './app/errors/error.interceptor';
import { environment } from './environments/environment';

/**
 * Amorçage de la Plateforme Fonctionnelle (§4.2, composants standalone) : HTTP + intercepteur de
 * jeton, routage, et client OIDC (configuration + tentative de connexion au démarrage, §4.5).
 *
 * <p>Hors production (D32), on démarre d'abord le Service Worker MSW pour servir les contrats sans
 * backend ni Keycloak ; en production, aucun mock n'est chargé.
 */
async function startMocksInDev(): Promise<void> {
  if (!environment.production && environment.useMocks) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

startMocksInDev()
  .then(() =>
    bootstrapApplication(AppComponent, {
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideRouter(routes),
        provideOAuthClient(),
        { provide: BASE_PATH, useValue: environment.apiBaseUrl },
        provideAppInitializer(() => {
          const oauth = inject(OAuthService);
          oauth.configure(authConfig);
          // Mode mocks : on tente seulement de récupérer une session. Mode live : on exige la
          // connexion (redirection vers Keycloak si pas de jeton valide), §4.5.
          return environment.useMocks
            ? oauth.loadDiscoveryDocumentAndTryLogin()
            : oauth.loadDiscoveryDocumentAndLogin();
        }),
      ],
    }),
  )
  .catch((err) => console.error(err));
