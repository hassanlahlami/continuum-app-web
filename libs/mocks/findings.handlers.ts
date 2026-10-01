import { http, HttpResponse } from 'msw';
import type { FindingPage } from '../api-clients/findings';

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

export const findingsHandlers = [
  http.get('*/api/app/findings', () => HttpResponse.json(findingsPageFixture)),
];
