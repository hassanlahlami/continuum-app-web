import { http, HttpResponse } from 'msw';
import type { Finding, FindingPage } from '../api-clients/findings';

/** Mocks MSW du module « constats » (front-first, GUIDE §6) — fixture typée par le client généré. */
export const findingsPageFixture: FindingPage = {
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1,
  items: [
    {
      id: 'c1a2b3d4-0000-0000-0000-000000000001',
      reference: 'FND-2026-INSP-014-001',
      title: 'Écriture au-dessus du seuil sans double validation',
      status: { code: 'VALIDATED', label: 'Validé' },
      criticality: { code: 'HIGH', label: 'Élevée' },
      missionTitle: 'Inspection agence A001',
      meta: { createdAt: '2026-01-10T10:00:00Z', version: 2 },
    },
  ],
};

/**
 * Détail FRAP d'un constat encore OUVERT, avec l'action `validate` décidée par le serveur
 * (§2.1.4) : le front n'affiche que ce que le serveur renvoie dans {@code availableActions}.
 */
function openFinding(missionId: string, findingId: string): Finding {
  return {
    id: findingId,
    reference: 'FND-2026-INSP-014-001',
    title: 'Écriture au-dessus du seuil sans double validation',
    status: { code: 'OUVERT', label: 'Ouvert' },
    criticality: { code: 'HIGH', label: 'Élevée' },
    missionId,
    missionTitle: 'Inspection agence A001',
    fact: "U003 a saisi et validé 3 virements au-dessus du seuil le même jour.",
    criterion: 'Double validation obligatoire au-delà du seuil (procédure interne).',
    cause: "Cumul des habilitations saisie + validation sur le même périmètre.",
    consequence: "Risque de virement frauduleux non détecté.",
    availableActions: [{ code: 'validate', label: 'Valider', style: 'primary' }],
    meta: { createdAt: '2026-01-10T10:00:00Z', version: 1 },
  };
}

/** Le même constat après validation : statut VALIDATED, plus aucune action disponible. */
function validatedFinding(missionId: string, findingId: string): Finding {
  const f = openFinding(missionId, findingId);
  return {
    ...f,
    status: { code: 'VALIDATED', label: 'Validé' },
    availableActions: [],
    meta: { ...f.meta, version: f.meta.version + 1 },
  };
}

export const findingsHandlers = [
  http.get('*/api/app/findings', () => HttpResponse.json(findingsPageFixture)),

  // Constats d'une mission (cockpit) : un constat ouvert, visible dans le périmètre de démo.
  http.get('*/api/app/missions/:missionId/findings', ({ params }) =>
    HttpResponse.json([openFinding(String(params['missionId']), 'c1a2b3d4-0000-0000-0000-000000000001')]),
  ),

  // Détail FRAP + actions disponibles.
  http.get('*/api/app/missions/:missionId/findings/:findingId', ({ params }) =>
    HttpResponse.json(openFinding(String(params['missionId']), String(params['findingId']))),
  ),

  // Action décidée par le serveur : seule `validate` est reconnue ; autre code → 422.
  http.post('*/api/app/missions/:missionId/findings/:findingId/actions/:actionCode', ({ params }) => {
    const missionId = String(params['missionId']);
    const findingId = String(params['findingId']);
    if (params['actionCode'] !== 'validate') {
      return HttpResponse.json({ title: 'Action non supportée' }, { status: 422 });
    }
    return HttpResponse.json(validatedFinding(missionId, findingId));
  }),
];
