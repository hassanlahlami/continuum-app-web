import { http, HttpResponse } from 'msw';
import type { MissionPage } from '../api-clients/missions';

/** Mocks MSW du module « missions » (front-first, GUIDE §6) — fixture typée par le client généré. */
export const missionsPageFixture: MissionPage = {
  page: 0,
  size: 20,
  totalItems: 1,
  totalPages: 1,
  items: [
    {
      id: '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e',
      reference: 'MIS-2026-INSP-014',
      title: 'Inspection agence A001',
      missionType: { code: 'INSPECTION', label: 'Inspection' },
      status: { code: 'IN_PROGRESS', label: 'En cours' },
      phase: { code: 'REALISATION', label: 'Réalisation' },
      progressPercent: 40,
      meta: { createdAt: '2026-01-05T09:00:00Z', version: 3 },
    },
  ],
};

export const missionsHandlers = [
  http.get('*/api/app/missions', () => HttpResponse.json(missionsPageFixture)),
];
