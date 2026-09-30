import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

/**
 * Amorçage de la Plateforme Fonctionnelle (§4.2, composants standalone).
 * L'authentification (OIDC/PKCE vers Keycloak) et l'intercepteur de jeton seront ajoutés ensuite.
 */
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
}).catch((err) => console.error(err));
