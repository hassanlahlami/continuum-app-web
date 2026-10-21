import { http, HttpResponse } from 'msw';
import type {
  ActionRequest,
  CcmControl,
  CcmException,
  CcmExceptionPage,
  CcmOverview,
  CcmRunPage,
} from '../api-clients/ccm';

/**
 * Mocks MSW du flux d'exceptions CCM (§5.3, D34, front-first) — fixtures typées par le client généré.
 * Le serveur décide : {@code availableActions} et les refus (403/409/422) sont renvoyés par le mock, le
 * front n'invente aucune règle. Deux exceptions « sentinelles » exercent les refus en e2e :
 *   …000000000403 → droit insuffisant (403), …000000000409 → état incompatible (409).
 */
const RETAIN = { code: 'retain', label: 'Retenir', style: 'primary' as const };
const DISMISS = { code: 'dismiss', label: 'Écarter' };
const ASSIGN = { code: 'assign', label: 'Affecter' };
const REOPEN = { code: 'reopen', label: 'Rouvrir' };

function baseException(id: string): CcmException {
  return {
    id,
    controlCode: 'SEUIL-HORAIRE',
    controlLabel: 'Écritures hors seuil / hors heures',
    status: { code: 'NEW', label: 'À trier' },
    criticality: { code: 'HIGH', label: 'Élevée', color: 'criticality-high' },
    summary: 'Écriture hors cadre (AMOUNT) : 2 500 000 MAD',
    detectedAt: '2026-09-12T08:30:00Z',
    unit: { id: 'b1111111-1111-1111-1111-111111111111', code: 'AG-A001', label: 'Agence A001' },
    sourceRecord: { movementId: 4, accountId: 'A001000000002', amount: '2500000.00', channel: 'GUICHET' },
    availableActions: [RETAIN, DISMISS, ASSIGN],
  };
}

const NEW_ID = 'ce000000-0000-0000-0000-0000000000e1';
const RETAINED_ID = 'ce000000-0000-0000-0000-0000000000e2';

function exceptionFor(id: string): CcmException {
  if (id === RETAINED_ID) {
    return { ...baseException(id), status: { code: 'RETAINED', label: 'Retenue' }, availableActions: [ASSIGN] };
  }
  return baseException(id);
}

export const ccmExceptionPageFixture: CcmExceptionPage = {
  page: 0,
  size: 25,
  totalItems: 2,
  totalPages: 1,
  items: [exceptionFor(NEW_ID), exceptionFor(RETAINED_ID)],
};

/**
 * Fixtures de la bibliothèque de contrôles (§5) — les 3 contrôles MVP du pack Banque. Valeurs par défaut
 * issues du pack (`docs/pack-banque/CONTROLES-CCM.md`), non codées en dur côté noyau. SOD-VIREMENTS et
 * SEUIL-HORAIRE sont activés ; COMPTES-DORMANTS est désactivé (pour exercer le filtre `active`).
 */
export const ccmControlsFixture: CcmControl[] = [
  {
    id: 'cc100000-0000-0000-0000-000000000001',
    code: 'SOD-VIREMENTS',
    label: 'Séparation des tâches — virements',
    category: 'ACCESS',
    description: 'Même utilisateur saisissant et validant un virement (cumul interdit, §2.2).',
    normativeReference: 'COSO — Control Activities (SoD)',
    dataset: 'ACCESS',
    active: true,
    health: 'NEVER_RUN',
    parameterDefinitions: [
      { name: 'makerFunction', label: 'Fonction de saisie', type: 'STRING' },
      { name: 'checkerFunction', label: 'Fonction de validation', type: 'STRING' },
    ],
    settings: {
      version: 1,
      parameters: { makerFunction: 'SAISIE_VIREMENT', checkerFunction: 'VALIDATION_VIREMENT' },
      schedule: { mode: 'ON_EVENT' },
    },
  },
  {
    id: 'cc100000-0000-0000-0000-000000000002',
    code: 'SEUIL-HORAIRE',
    label: 'Écritures hors seuil / hors heures',
    category: 'TRANSACTIONS',
    description: 'Écritures au-dessus du seuil ou en dehors des jours ouvrés.',
    normativeReference: 'BCBS 239 — exhaustivité et exactitude',
    dataset: 'TRANSACTIONS',
    active: true,
    health: 'OK',
    exceptionRate: 0.012,
    lastRunAt: '2026-09-12T06:00:00Z',
    parameterDefinitions: [
      { name: 'thresholdAmount', label: 'Seuil de montant', type: 'MONEY' },
      { name: 'maxBackValueDays', label: 'Jours d\'antériorité max', type: 'NUMBER' },
    ],
    settings: {
      version: 3,
      parameters: { thresholdAmount: 1000000, maxBackValueDays: 2, nonWorkingDays: ['SAT', 'SUN'] },
      schedule: { mode: 'CRON', cron: '0 0 6 * * *' },
    },
  },
  {
    id: 'cc100000-0000-0000-0000-000000000003',
    code: 'COMPTES-DORMANTS',
    label: 'Comptes dormants réactivés',
    category: 'MASTER_DATA',
    description: 'Mouvements sur des comptes inactifs depuis plusieurs mois.',
    normativeReference: 'Bâle — risque opérationnel',
    dataset: 'MASTER_DATA',
    active: false,
    health: 'NEVER_RUN',
    parameterDefinitions: [
      { name: 'dormancyMonths', label: 'Mois d\'inactivité', type: 'NUMBER' },
      { name: 'minAmount', label: 'Montant minimum', type: 'MONEY' },
    ],
    settings: {
      version: 1,
      parameters: { dormancyMonths: 12, minAmount: 10000 },
    },
  },
];

/** Vue d'ensemble du cockpit (§5) : agrégats cohérents avec les fixtures de contrôles et d'exceptions. */
export const ccmOverviewFixture: CcmOverview = {
  activeControls: 2,
  failingControls: 0,
  driftingControls: 0,
  openExceptions: 3,
  exceptionsToTriage: 2,
  controls: ccmControlsFixture,
  exceptionTrend: [
    { date: '2026-09-10', count: 2 },
    { date: '2026-09-11', count: 2 },
    { date: '2026-09-12', count: 1 },
  ],
};

export const ccmHandlers = [
  // Vue d'ensemble du cockpit (§5).
  http.get('*/api/app/ccm/overview', () => HttpResponse.json(ccmOverviewFixture)),

  // Bibliothèque de contrôles (§5) — filtrable par recherche libre, catégorie et activation.
  http.get('*/api/app/ccm/controls', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const category = url.searchParams.get('category');
    const active = url.searchParams.get('active');
    const list = ccmControlsFixture.filter((c) => {
      if (q && !(c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))) return false;
      if (category && c.category !== category) return false;
      if (active != null && active !== '' && c.active !== (active === 'true')) return false;
      return true;
    });
    return HttpResponse.json(list);
  }),

  // Historique des exécutions d'un contrôle (§5).
  http.get('*/api/app/ccm/controls/:controlId/runs', ({ params }) => {
    const controlId = String(params['controlId']);
    const runs: CcmRunPage = {
      page: 0,
      size: 10,
      totalItems: 2,
      totalPages: 1,
      items: [
        {
          id: 'run00000-0000-0000-0000-000000000002',
          controlId,
          controlLabel: 'Écritures hors seuil / hors heures',
          status: 'SUCCEEDED',
          trigger: 'SCHEDULE',
          startedAt: '2026-09-12T06:00:00Z',
          finishedAt: '2026-09-12T06:00:12Z',
          populationSize: 1200,
          exceptionsCount: 2,
          dataSource: 'amplitude-sim (JDBC, vues V_AUDIT_*)',
          parametersUsed: { thresholdAmount: 1000000 },
        },
        {
          id: 'run00000-0000-0000-0000-000000000001',
          controlId,
          controlLabel: 'Écritures hors seuil / hors heures',
          status: 'FAILED',
          trigger: 'SCHEDULE',
          startedAt: '2026-09-11T06:00:00Z',
          finishedAt: '2026-09-11T06:00:04Z',
          exceptionsCount: 0,
          problem: { title: "Échec d'exécution", status: 502, detail: 'connexion CBS perdue', traceId: 'mock-run-01' },
        },
      ],
    };
    return HttpResponse.json(runs);
  }),

  // Fiche d'un contrôle.
  http.get('*/api/app/ccm/controls/:controlId', ({ params }) => {
    const control = ccmControlsFixture.find((c) => c.id === String(params['controlId']));
    return control
      ? HttpResponse.json(control)
      : HttpResponse.json({ title: 'Contrôle introuvable' }, { status: 404 });
  }),

  // Flux d'exceptions à trier (filtre `assignedToMe` : seule l'exception NEW est affectée au courant).
  http.get('*/api/app/ccm/exceptions', ({ request }) => {
    const mine = new URL(request.url).searchParams.get('assignedToMe') === 'true';
    const items = ccmExceptionPageFixture.items.filter((e) => !mine || e.id === NEW_ID);
    return HttpResponse.json({ ...ccmExceptionPageFixture, totalItems: items.length, items });
  }),

  // Détail d'une exception (jusqu'à l'enregistrement source du CBS).
  http.get('*/api/app/ccm/exceptions/:exceptionId', ({ params }) =>
    HttpResponse.json(exceptionFor(String(params['exceptionId']))),
  ),

  // Action de triage décidée par le serveur ; transitions + refus métier.
  http.post('*/api/app/ccm/exceptions/:exceptionId/actions/:actionCode', async ({ params, request }) => {
    const id = String(params['exceptionId']);
    const action = String(params['actionCode']);
    const body = (await request.json().catch(() => ({}))) as ActionRequest;

    if (!['retain', 'dismiss', 'assign', 'reopen'].includes(action)) {
      return HttpResponse.json({ title: 'Action non supportée' }, { status: 422 });
    }
    if (id.endsWith('000000000403')) {
      return HttpResponse.json(
        { title: 'Droit insuffisant', detail: 'ccm.exception.triage absent sur cette exception.' },
        { status: 403, headers: { 'content-type': 'application/problem+json' } },
      );
    }
    if (id.endsWith('000000000409')) {
      return HttpResponse.json(
        { title: 'État incompatible', detail: "Action impossible depuis le statut courant." },
        { status: 409, headers: { 'content-type': 'application/problem+json' } },
      );
    }

    const exc = baseException(id);
    switch (action) {
      case 'retain':
        return HttpResponse.json({ ...exc, status: { code: 'RETAINED', label: 'Retenue' }, availableActions: [ASSIGN] });
      case 'dismiss':
        if (!body?.comment || !body.comment.trim()) {
          return HttpResponse.json(
            { title: 'Justification requise', detail: 'Écarter une exception exige une justification (§5.3).' },
            { status: 422, headers: { 'content-type': 'application/problem+json' } },
          );
        }
        return HttpResponse.json({
          ...exc,
          status: { code: 'DISMISSED', label: 'Écartée' },
          dismissalJustification: body.comment,
          availableActions: [REOPEN],
        });
      case 'reopen':
        return HttpResponse.json({ ...exc, status: { code: 'NEW', label: 'À trier' }, availableActions: [RETAIN, DISMISS, ASSIGN] });
      default: // assign
        return HttpResponse.json({ ...exc, assignee: { id: 'u2222222-2222-2222-2222-222222222222', displayName: 'Inspecteur' } });
    }
  }),

  // Conversion d'une exception retenue en constat candidat (§5.3).
  http.post('*/api/app/ccm/exceptions/:exceptionId/finding-candidate', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { missionId?: string };
    const missionId = body?.missionId ?? 'f1111111-1111-1111-1111-111111111101';
    const findingId = 'a1110000-0000-0000-0000-0000000000f1';
    return HttpResponse.json(
      { findingId, missionId, route: `/missions/${missionId}/findings/${findingId}` },
      { status: 201 },
    );
  }),
];
