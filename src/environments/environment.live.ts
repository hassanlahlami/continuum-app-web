/**
 * Cible « live » : vrai backend + login OIDC (pas de mocks). Utilisée par la configuration de build
 * `live` (ng serve --configuration live). Le proxy de dev (proxy.conf.json) route `/api` vers le
 * backend (http://localhost:8080) pour éviter CORS en conservant des chemins relatifs.
 */
export const environment = {
  production: false,
  useMocks: false,
  oidcIssuer: 'http://localhost:8180/realms/banque-demo',
  apiBaseUrl: '/api/app',
};
