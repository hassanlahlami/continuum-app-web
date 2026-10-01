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
  progressPercent: 40,
  meta: { createdAt: '2026-01-05T09:00:00Z', version: 3 },
};

export const missionsPageFixture: MissionPage = {
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1,
  items: [missionFixture],
};

export const missionsHandlers = [
  http.get('*/api/app/missions', () => HttpResponse.json(missionsPageFixture)),
  http.get('*/api/app/missions/:missionId', () => HttpResponse.json(missionFixture)),
];
