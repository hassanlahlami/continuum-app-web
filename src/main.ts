import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { LOCALE_ID, inject, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import { BASE_PATH } from '../libs/api-clients/me';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AUTH_ENTITY, AuthFacade } from './app/auth/auth.facade';
import { authInterceptor } from './app/auth/auth.interceptor';
import { errorInterceptor } from './app/errors/error.interceptor';
import { environment } from './environments/environment';

// Locale française : formatage des dates, nombres, montants et pourcentages (§1.6, i18n).
registerLocaleData(localeFr);

/**
 * Configuration d'exécution **par installation** (on-premise, D26) : un seul artefact buildé, dont
 * l'issuer OIDC, l'URL d'API et le code tenant sont fixés par `config.json` servi à la racine — édité
 * par l'intégrateur sans reconstruction. Les valeurs du build (`environment.*`) servent de défauts si
 * le fichier est absent ou illisible.
 */
interface RuntimeConfig {
  oidcIssuer: string;
  apiBaseUrl: string;
  tenantCode: string;
}

async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const defaults: RuntimeConfig = {
    oidcIssuer: environment.oidcIssuer,
    apiBaseUrl: environment.apiBaseUrl,
    tenantCode: environment.tenantCode,
  };
  try {
    const res = await fetch(new URL('config.json', document.baseURI).href, { cache: 'no-store' });
    if (!res.ok) {
      return defaults;
    }
    const raw = (await res.json()) as Partial<RuntimeConfig>;
    return {
      oidcIssuer: typeof raw.oidcIssuer === 'string' && raw.oidcIssuer ? raw.oidcIssuer : defaults.oidcIssuer,
      apiBaseUrl: typeof raw.apiBaseUrl === 'string' && raw.apiBaseUrl ? raw.apiBaseUrl : defaults.apiBaseUrl,
      tenantCode: typeof raw.tenantCode === 'string' && raw.tenantCode ? raw.tenantCode : defaults.tenantCode,
    };
  } catch {
    return defaults; // config.json absent/illisible : on garde les valeurs du build
  }
}

/**
 * Amorçage de la Plateforme Fonctionnelle (§4.2, composants standalone) : HTTP + intercepteur de
 * jeton, routage, et client OIDC (configuration + tentative de connexion au démarrage, §4.5).
 *
 * <p>Hors production (D32), on démarre d'abord le Service Worker MSW pour servir les contrats sans
 * backend ni Keycloak ; en production, aucun mock n'est chargé.
 */
async function startMocksInDev(): Promise<void> {
  if (!environment.production && environment.useMocks) {
    // Démarrage best-effort : un Service Worker MSW périmé ou en échec ne doit JAMAIS empêcher
    // l'amorçage de l'application (sinon page blanche). On avertit et on continue sans mocks.
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (err) {
      console.warn('[MSW] démarrage des mocks impossible — poursuite sans mocks.', err);
    }
  }
}

/**
 * Charge le thème du tenant (§1.6.3) AVANT la connexion : la page de login est déjà aux couleurs du
 * client. La feuille servie par {@code GET /api/public/theme} surcharge les tokens --ct-* par défaut
 * (styles.css). En cas d'indisponibilité, l'apparence par défaut reste valable.
 */
async function loadTenantTheme(tenantCode: string): Promise<void> {
  try {
    const res = await fetch(`/api/public/theme?entity=${encodeURIComponent(tenantCode)}`);
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
  .then(loadRuntimeConfig)
  .then(async (config) => {
    await loadTenantTheme(config.tenantCode);
    return config;
  })
  .then((config) =>
    bootstrapApplication(AppComponent, {
      providers: [
        { provide: LOCALE_ID, useValue: 'fr' },
        provideHttpClient(
          withInterceptors([authInterceptor, errorInterceptor]),
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
        ),
        provideAnimationsAsync(),
        provideRouter(routes),
        { provide: AUTH_ENTITY, useValue: config.tenantCode },
        { provide: BASE_PATH, useValue: config.apiBaseUrl },
        // Charge l'état de session et pose le cookie CSRF avant l'amorçage ; la garde route vers /login (D41).
        provideAppInitializer(() =>
          firstValueFrom(inject(AuthFacade).refresh().pipe(catchError(() => of(undefined)))),
        ),
      ],
    }),
  )
  .catch((err) => console.error(err));
