import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

/**
 * Amorçage de la Plateforme Fonctionnelle (§4.2, composants standalone).
 * Auth OIDC/PKCE vers Keycloak et intercepteur de jeton : à ajouter.
 */
bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
}).catch((err) => console.error(err));
