import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

/**
 * Configuration OIDC (plan §4.2, §4.5) : client `continuum-app`, Authorization Code + PKCE vers
 * Keycloak. L'`issuer` vient de l'`environment` (configuration d'exécution par installation).
 */
export const authConfig: AuthConfig = {
  issuer: environment.oidcIssuer,
  clientId: 'continuum-app',
  responseType: 'code',
  redirectUri: typeof window !== 'undefined' ? window.location.origin + '/' : '/',
  scope: 'openid profile email',
  requireHttps: false, // dev/simulation uniquement
  showDebugInformation: false,
};
