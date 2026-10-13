import { CcmControl } from '../../libs/api-clients/ccm';

/**
 * Libellés d'affichage des énumérations fermées du contrat CCM (§5). Ce ne sont pas des constantes
 * métier paramétrables mais la traduction i18n de valeurs d'énumération livrées par le contrat (D32) :
 * catégories de contrôle et état de santé sont génériques (agnostiques du secteur, D35).
 */
export const CCM_CATEGORY_LABELS: Record<CcmControl.CategoryEnum, string> = {
  CONFIGURATION: 'Configuration',
  MASTER_DATA: 'Données de référence',
  TRANSACTIONS: 'Transactions',
  ACCESS: 'Habilitations',
  RECONCILIATION: 'Rapprochements',
};

export const CCM_HEALTH_LABELS: Record<CcmControl.HealthEnum, string> = {
  OK: 'Conforme',
  DRIFT: 'Dérive',
  FAILING: 'En échec',
  NEVER_RUN: 'Jamais exécuté',
};
