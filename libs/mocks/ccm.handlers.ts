import { http, HttpResponse } from 'msw';
import type { ActionRequest, CcmException, CcmExceptionPage } from '../api-clients/ccm';

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

export const ccmHandlers = [
  // Flux d'exceptions à trier.
  http.get('*/api/app/ccm/exceptions', () => HttpResponse.json(ccmExceptionPageFixture)),

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
