/**
 * Configuration d'exécution de la Plateforme Fonctionnelle. Valeurs par défaut (simulation, D31) ;
 * remplacées par `environment.<cible>.ts` ou une configuration d'exécution selon l'installation.
 * Rien de sensible ici (pas de secret — Vault, §4).
 */
export const environment = {
  production: false,
  /** true = mocks MSW (sans backend/login) ; false = vrai backend + login OIDC (voir environment.live.ts). */
  useMocks: true,
  /** Émetteur OIDC (realm Keycloak), §4.5. Port 8180 = Keycloak de la simulation (infra/simulation). */
  oidcIssuer: 'http://localhost:8180/realms/banque-demo',
  /** Préfixe de l'API de la Plateforme Fonctionnelle, §4.3.3. */
  apiBaseUrl: '/api/app',
  /** Code de l'entité pour le thème public (§1.6) ; en production résolu par le nom d'hôte. */
  tenantCode: 'BANQUE-DEMO',
};
