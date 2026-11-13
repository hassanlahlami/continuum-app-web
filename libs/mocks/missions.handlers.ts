import { http, HttpResponse } from 'msw';
import type { Mission, MissionPage } from '../api-clients/missions';

/** Mocks MSW du module « missions » (front-first, GUIDE §6) — fixtures typées par le client généré. */
export const missionFixture: Mission = {
  id: '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e',
  reference: 'MIS-2026-INSP-014',
  title: 'Inspection agence A001',
  missionType: { code: 'INSPECTION', label: 'Inspection' },
  status: { code: 'IN_PROGRESS', label: 'En cours' },
  phase: { code: 'REALISATION', label: 'Réalisation' },
  unit: { id: '3f6c2a1e-8b7d-4c21-9a55-0e2f4b6d8c10', label: 'Inspection Générale' },
  lead: { id: '00000000-0000-0000-0000-0000000000f1', displayName: 'Inès Gendron', positionLabel: 'Chef de mission' },
  scope:
    "Revue des opérations de l'agence A001 : octroi de crédit, tenue de caisse, séparation des tâches " +
    'saisie/validation des virements, et conformité à la circulaire de contrôle interne.',
  plannedStart: '2026-01-06T00:00:00Z',
  plannedEnd: '2026-02-28T00:00:00Z',
  progressPercent: 40,
  findingsCount: 1,
  overdueTasksCount: 2,
  auditedEntities: [
    { id: 'ae-0001', label: 'Agence A001 — Casablanca Centre' },
    { id: 'ae-0002', label: 'Back-office crédits' },
  ],
  meta: { createdAt: '2026-01-05T09:00:00Z', version: 3 },
};

const ALL_MISSIONS: Mission[] = [
  missionFixture,
  {
    id: 'a1c2e3f4-0000-0000-0000-000000000002',
    reference: 'MIS-2026-AUD-009',
    title: 'Audit du processus crédits',
    missionType: { code: 'AUDIT', label: 'Audit' },
    status: { code: 'PLANNED', label: 'Planifiée' },
    phase: { code: 'PREPARATION', label: 'Préparation' },
    unit: { id: '3f6c2a1e-8b7d-4c21-9a55-0e2f4b6d8c10', label: 'Inspection Générale' },
    lead: { id: '00000000-0000-0000-0000-0000000000f2', displayName: 'Omar Haddad', positionLabel: 'Inspecteur' },
    progressPercent: 5,
    findingsCount: 0,
    meta: { createdAt: '2026-01-20T09:00:00Z', version: 1 },
  },
  {
    id: 'a1c2e3f4-0000-0000-0000-000000000003',
    reference: 'MIS-2025-INSP-051',
    title: 'Inspection agence B204',
    missionType: { code: 'INSPECTION', label: 'Inspection' },
    status: { code: 'CLOSED', label: 'Clôturée' },
    phase: { code: 'CLOTURE', label: 'Clôture' },
    unit: { id: '3f6c2a1e-8b7d-4c21-9a55-0e2f4b6d8c10', label: 'Inspection Générale' },
    lead: { id: '00000000-0000-0000-0000-0000000000f3', displayName: 'Salma Benali', positionLabel: 'Chef de mission' },
    progressPercent: 100,
    findingsCount: 5,
    meta: { createdAt: '2025-11-02T09:00:00Z', version: 7 },
  },
];

/** Missions affectées à l'utilisateur courant (filtre `mine=true`). */
const MY_MISSION_IDS = new Set(['9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e']);

export const missionsPageFixture: MissionPage = {
  page: 0,
  size: 20,
  totalItems: ALL_MISSIONS.length,
  totalPages: 1,
  items: ALL_MISSIONS,
};

const UNIT = '3f6c2a1e-8b7d-4c21-9a55-0e2f4b6d8c10';
const TYPES = [
  { code: 'INSPECTION', label: 'Inspection', processKey: 'mission-inspection', defaultDurationDays: 15 },
  { code: 'AUDIT', label: 'Audit', processKey: 'mission-audit', defaultDurationDays: 30 },
];
const ENTITIES = [
  { id: 'ae-0001', label: 'Agence A001 — Casablanca Centre', kind: 'ORG_UNIT', unitId: UNIT, meta: { createdAt: '2026-01-01T00:00:00Z', version: 1 } },
  { id: 'ae-0002', label: 'Back-office crédits', kind: 'PROCESS', unitId: UNIT, meta: { createdAt: '2026-01-01T00:00:00Z', version: 1 } },
];

export const missionsHandlers = [
  http.get('*/api/app/mission-types', () => HttpResponse.json(TYPES)),
  http.get('*/api/app/auditable-entities', ({ request }) => {
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase();
    const items = ENTITIES.filter((e) => !q || e.label.toLowerCase().includes(q));
    return HttpResponse.json({ page: 0, size: 50, totalItems: items.length, totalPages: 1, items });
  }),
  http.post('*/api/app/missions', async ({ request }) => {
    const b = (await request.json()) as { title?: string; plannedStart?: string; plannedEnd?: string };
    if (!b.title || !b.plannedStart || !b.plannedEnd || b.plannedEnd < b.plannedStart) {
      return HttpResponse.json(
        { type: 'about:blank', title: 'Validation failed', status: 422 },
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
      );
    }
    return HttpResponse.json(
      {
        ...missionFixture,
        id: 'a1c2e3f4-0000-0000-0000-0000000000ff',
        reference: 'MIS-2026-NEW-001',
        title: b.title,
        status: { code: 'PLANNED', label: 'Planifiée' },
        phase: { code: 'PREPARATION', label: 'Préparation' },
        meta: { createdAt: new Date().toISOString(), version: 1 },
      },
      { status: 201 },
    );
  }),
  http.get('*/api/app/missions', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const mine = url.searchParams.get('mine') === 'true';
    const items = ALL_MISSIONS.filter(
      (m) =>
        (!q || `${m.reference} ${m.title}`.toLowerCase().includes(q)) &&
        (!mine || MY_MISSION_IDS.has(m.id)),
    );
    return HttpResponse.json({ page: 0, size: 20, totalItems: items.length, totalPages: 1, items });
  }),
  http.get('*/api/app/missions/:missionId', () => HttpResponse.json(missionFixture)),
];
