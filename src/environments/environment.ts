/**
 * Configuration d'exécution de la Plateforme Fonctionnelle. Valeurs par défaut (simulation, D31) ;
 * remplacées par `environment.<cible>.ts` ou une configuration d'exécution selon l'installation.
 * Rien de sensible ici (pas de secret — Vault, §4).
 */
export const environment = {
  production: false,
  /** Émetteur OIDC (realm Keycloak), §4.5. */
  oidcIssuer: 'http://localhost:8080/realms/banque-demo',
  /** Préfixe de l'API de la Plateforme Fonctionnelle, §4.3.3. */
  apiBaseUrl: '/api/app',
};
