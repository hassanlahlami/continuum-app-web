import { AuthConfig } from 'angular-oauth2-oidc';

/**
 * Configuration OIDC (plan §4.2, §4.5) : client `continuum-app`, Authorization Code + PKCE vers
 * Keycloak. L'`issuer` est une **configuration d'exécution par installation** (runtime config
 * `config.json`, cf. main.ts) — pas de reconstruction par client. {@code requireHttps} est déduit de
 * l'issuer : exigé dès que l'issuer est en HTTPS (production), relâché pour le dev/simulation en HTTP.
 */
export function buildAuthConfig(issuer: string): AuthConfig {
  return {
    issuer,
    clientId: 'continuum-app',
    responseType: 'code',
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/' : '/',
    scope: 'openid profile email',
    requireHttps: issuer.startsWith('https'),
    showDebugInformation: false,
  };
}
