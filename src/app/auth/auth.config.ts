import { AuthConfig } from 'angular-oauth2-oidc';

/**
 * Configuration OIDC (plan §4.2, §4.5) : client `continuum-app`, Authorization Code + PKCE vers
 * Keycloak. L'`issuer` est une valeur d'environnement (ici le realm de la simulation, D31) ; à
 * externaliser par `environment` / configuration d'exécution.
 */
export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8080/realms/banque-demo',
  clientId: 'continuum-app',
  responseType: 'code',
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/' : '/',
  scope: 'openid profile email',
  requireHttps: false, // dev/simulation uniquement
  showDebugInformation: false,
};
