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

/**
 * Charge le thème du tenant (§1.6.3) AVANT la connexion : la page de login est déjà aux couleurs du
 * client. La feuille servie par {@code GET /api/public/theme} surcharge les tokens --ct-* par défaut
 * (styles.css). En cas d'indisponibilité, l'apparence par défaut reste valable.
 */
async function loadTenantTheme(): Promise<void> {
  try {
    const res = await fetch(`/api/public/theme?entity=${encodeURIComponent(environment.tenantCode)}`);
    if (res.ok) {
      const style = document.createElement('style');
      style.id = 'ct-tenant-theme';
      style.textContent = await res.text();
      document.head.appendChild(style);
    }
  } catch {
    // thème indisponible : on garde l'apparence par défaut (tokens de styles.css)
  }
}

startMocksInDev()
  .then(loadTenantTheme)
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
          // Mode mocks : best-effort (« sans backend/login », cf. environment). Si Keycloak est absent,
          // l'échec du document de découverte ne doit pas empêcher l'amorçage — on reste déconnecté.
          // Mode live : on exige la connexion (redirection vers Keycloak si pas de jeton valide), §4.5.
          return environment.useMocks
            ? oauth.loadDiscoveryDocumentAndTryLogin().catch(() => true)
            : oauth.loadDiscoveryDocumentAndLogin();
        }),
      ],
    }),
  )
  .catch((err) => console.error(err));
