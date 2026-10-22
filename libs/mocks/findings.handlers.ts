import { http, HttpResponse } from 'msw';
import type { Finding, FindingPage } from '../api-clients/findings';

/** Mocks MSW du module « constats » (front-first, GUIDE §6) — fixtures typées par le client généré. */
const ALL_FINDINGS: Finding[] = [
  {
    id: 'c1a2b3d4-0000-0000-0000-000000000001',
    reference: 'FND-2026-INSP-014-001',
    title: 'Écriture au-dessus du seuil sans double validation',
    status: { code: 'VALIDATED', label: 'Validé' },
    criticality: { code: 'HIGH', label: 'Élevée' },
    source: 'MANUAL',
    missionId: '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e',
    missionTitle: 'Inspection agence A001',
    meta: { createdAt: '2026-01-10T10:00:00Z', version: 2 },
  },
  {
    id: 'c1a2b3d4-0000-0000-0000-000000000002',
    reference: 'FND-2026-INSP-014-002',
    title: 'Compte dormant avec mouvement récent non justifié',
    status: { code: 'OUVERT', label: 'Ouvert' },
    criticality: { code: 'MEDIUM', label: 'Moyenne' },
    source: 'CCM',
    missionTitle: 'Inspection agence A001',
    meta: { createdAt: '2026-01-12T09:00:00Z', version: 1 },
  },
  {
    id: 'c1a2b3d4-0000-0000-0000-000000000003',
    reference: 'FND-2026-AUD-009-001',
    title: 'Procédure de clôture mensuelle incomplète',
    status: { code: 'OUVERT', label: 'Ouvert' },
    criticality: { code: 'LOW', label: 'Faible' },
    source: 'MANUAL',
    missionTitle: 'Audit processus crédits',
    meta: { createdAt: '2026-01-15T14:00:00Z', version: 1 },
  },
  {
    id: 'c1a2b3d4-0000-0000-0000-000000000004',
    reference: 'FND-2026-CCM-0003',
    title: 'Cumul saisie / validation des virements',
    status: { code: 'RETENU', label: 'Retenu' },
    criticality: { code: 'HIGH', label: 'Élevée' },
    source: 'CCM',
    missionTitle: 'Contrôle continu',
    meta: { createdAt: '2026-01-18T08:30:00Z', version: 1 },
  },
];

export const findingsPageFixture: FindingPage = {
  page: 0,
  size: 20,
  totalItems: ALL_FINDINGS.length,
  totalPages: 1,
  items: ALL_FINDINGS,
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
    source: 'MANUAL',
    riskFamilyCode: 'FRAUDE_INTERNE',
    missionId,
    missionTitle: 'Inspection agence A001',
    author: { id: '00000000-0000-0000-0000-0000000000f1', displayName: 'Inès Gendron', positionLabel: 'Chef de mission' },
    fact: "U003 a saisi et validé 3 virements au-dessus du seuil le même jour.",
    criterion: 'Double validation obligatoire au-delà du seuil (procédure interne).',
    cause: "Cumul des habilitations saisie + validation sur le même périmètre.",
    consequence: "Risque de virement frauduleux non détecté.",
    evidences: [
      {
        id: 'att-0001', fileName: 'extrait-mouvements-A001.pdf', mediaType: 'application/pdf',
        size: 184320, sha256: '9f86d081884c7d659a2feaa0c55ad015', uploadedAt: '2026-01-10T11:00:00Z',
        uploadedBy: { id: '00000000-0000-0000-0000-0000000000f1', displayName: 'Inès Gendron' },
        category: { code: 'EVIDENCE', label: 'Pièce justificative' },
      },
      {
        id: 'att-0002', fileName: 'journal-habilitations.xlsx',
        mediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 45678, sha256: '2c26b46b68ffc68ff99b453c1d304134', uploadedAt: '2026-01-10T11:05:00Z',
        category: { code: 'EXPORT', label: 'Export' },
      },
    ],
    reviewComments: [
      {
        field: 'criterion', comment: "Préciser la référence exacte de la procédure interne.",
        author: { id: '00000000-0000-0000-0000-0000000000f2', displayName: 'Omar Haddad' },
        at: '2026-01-11T09:00:00Z', resolved: false,
      },
      {
        field: 'fact', comment: 'Fait confirmé par échantillon de 12 opérations.',
        author: { id: '00000000-0000-0000-0000-0000000000f2', displayName: 'Omar Haddad' },
        at: '2026-01-11T09:05:00Z', resolved: true,
      },
    ],
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
  http.get('*/api/app/findings', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const source = url.searchParams.get('source');
    const criticality = url.searchParams.get('criticality');
    const items = ALL_FINDINGS.filter(
      (f) =>
        (!q || `${f.reference} ${f.title}`.toLowerCase().includes(q)) &&
        (!source || f.source === source) &&
        (!criticality || f.criticality?.code === criticality),
    );
    return HttpResponse.json({ page: 0, size: 20, totalItems: items.length, totalPages: 1, items });
  }),

  // Constats d'une mission (cockpit) : un constat ouvert, visible dans le périmètre de démo.
  http.get('*/api/app/missions/:missionId/findings', ({ params }) =>
    HttpResponse.json([openFinding(String(params['missionId']), 'c1a2b3d4-0000-0000-0000-000000000001')]),
  ),

  // Détail FRAP + actions disponibles.
  http.get('*/api/app/missions/:missionId/findings/:findingId', ({ params }) =>
    HttpResponse.json(openFinding(String(params['missionId']), String(params['findingId']))),
  ),

  // Action décidée par le serveur : seule `validate` est reconnue ; autre code → 422.
  // Deux constats « sentinelles » exercent les refus métier côté e2e (FND-03) :
  //   …000000000409 → SoD dynamique (409), …000000000403 → droit insuffisant (403).
  http.post('*/api/app/missions/:missionId/findings/:findingId/actions/:actionCode', ({ params }) => {
    const missionId = String(params['missionId']);
    const findingId = String(params['findingId']);
    if (params['actionCode'] !== 'validate') {
      return HttpResponse.json({ title: 'Action non supportée' }, { status: 422 });
    }
    if (findingId.endsWith('000000000409')) {
      return HttpResponse.json(
        { title: 'Conflit SoD', detail: "Validation refusée : conflit SoD dynamique (§2.2) — l'auteur ne peut pas valider." },
        { status: 409, headers: { 'content-type': 'application/problem+json' } },
      );
    }
    if (findingId.endsWith('000000000403')) {
      return HttpResponse.json(
        { title: 'Droit insuffisant', detail: 'finding.validate absent sur ce constat.' },
        { status: 403, headers: { 'content-type': 'application/problem+json' } },
      );
    }
    return HttpResponse.json(validatedFinding(missionId, findingId));
  }),
];
