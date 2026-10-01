import { http, HttpResponse } from 'msw';
import type { Me, Permissions } from '../api-clients/me';

/**
 * Mocks MSW du module « me » (front-first, GUIDE §6). Les fixtures sont **typées par le client
 * généré** : si le contrat change, elles cessent de compiler. Scénario nominal, persona `ig.demo`.
 */

const INSPECTION_UNIT = '3f6c2a1e-8b7d-4c21-9a55-0e2f4b6d8c10';

export const permissionsFixture: Permissions = {
  authzVersion: 12,
  features: [
    { code: 'mission.read', scopes: [{ type: 'UNIT_TREE', id: INSPECTION_UNIT, label: 'Inspection Générale' }] },
    { code: 'finding.write', scopes: [{ type: 'MISSION', id: '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e', label: 'Inspection agence A001' }] },
    { code: 'finding.read', scopes: [{ type: 'UNIT_TREE', id: INSPECTION_UNIT, label: 'Inspection Générale' }] },
  ],
};

export const meFixture: Me = {
  user: { id: '00000000-0000-0000-0000-0000000000aa', displayName: 'Inspecteur Un', positionLabel: 'Inspecteur' },
  email: 'inspecteur.un@banque-demo.test',
  entity: { id: '00000000-0000-0000-0000-000000000001', code: 'BANQUE-DEMO', label: 'Banque Démo' },
  availableEntities: [
    { id: '00000000-0000-0000-0000-000000000001', code: 'BANQUE-DEMO', label: 'Banque Démo' },
  ],
  assignments: [
    { positionLabel: 'Chef de département Inspection', kind: 'HOLDER', unit: { id: INSPECTION_UNIT, code: 'DIR_AUDIT', label: 'Inspection Générale' } },
  ],
  locale: 'fr',
};

export const meHandlers = [
  http.get('*/api/app/me/permissions', () => HttpResponse.json(permissionsFixture)),
  http.get('*/api/app/me', () => HttpResponse.json(meFixture)),
];
