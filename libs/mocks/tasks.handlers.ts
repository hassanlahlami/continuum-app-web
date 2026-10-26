import { http, HttpResponse } from 'msw';
import type { Task } from '../api-clients/me';

/** Mocks MSW de « Mes tâches » (COM-09) — fixtures typées par le client généré, état en mémoire. */
const MISSION_ID = '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e';

const tasks: Task[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    title: 'Valider le constat FND-2026-INSP-014-001',
    objectType: 'FINDING',
    objectId: 'c1a2b3d4-0000-0000-0000-000000000001',
    objectLabel: 'Inspection agence A001',
    status: 'CLAIMED',
    dueAt: '2026-01-05T17:00:00Z',
    overdue: true,
    route: `/missions/${MISSION_ID}/findings/c1a2b3d4-0000-0000-0000-000000000001`,
    availableActions: [{ code: 'complete', label: 'Terminer', style: 'primary' }],
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    title: 'Trier l’exception CCM « cumul saisie / validation »',
    objectType: 'CCM_EXCEPTION',
    objectId: 'e0000000-0000-0000-0000-000000000001',
    status: 'OPEN',
    candidateCount: 3,
    dueAt: '2099-02-01T17:00:00Z',
    overdue: false,
    route: '/ccm/exceptions/e0000000-0000-0000-0000-000000000001',
    availableActions: [{ code: 'claim', label: 'Prendre', style: 'secondary' }],
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    title: 'Approuver le rapport définitif',
    objectType: 'REPORT',
    objectId: 'f0000000-0000-0000-0000-000000000001',
    objectLabel: 'Inspection agence A001',
    status: 'OPEN',
    candidateCount: 1,
    dueAt: '2099-02-10T17:00:00Z',
    overdue: false,
    route: '/missions/' + MISSION_ID,
    availableActions: [],
  },
  {
    // Sentinelle : la prise échoue en 409 (tâche prise simultanément par un collègue).
    id: 'd0000000-0000-0000-0000-000000000409',
    title: 'Instruire la demande de documents',
    objectType: 'DOCUMENT_REQUEST',
    objectId: 'a0000000-0000-0000-0000-000000000001',
    status: 'OPEN',
    candidateCount: 2,
    overdue: false,
    route: '/missions/' + MISSION_ID,
    availableActions: [{ code: 'claim', label: 'Prendre', style: 'secondary' }],
  },
];

export const tasksHandlers = [
  http.get('*/api/app/tasks', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? 'OPEN';
    const objectType = url.searchParams.get('objectType');
    const overdueOnly = url.searchParams.get('overdueOnly') === 'true';
    // « OPEN » = à traiter : tâches proposées et tâches que j'ai prises (le serveur unifie, parapheur inclus).
    const items = tasks
      .filter((t) => (status === 'OPEN' ? t.status === 'OPEN' || t.status === 'CLAIMED' : t.status === status))
      .filter((t) => !objectType || t.objectType === objectType)
      .filter((t) => !overdueOnly || t.overdue)
      .sort((a, b) => Number(!!b.overdue) - Number(!!a.overdue)); // en retard en tête
    return HttpResponse.json({ items, page: 0, size: 20, totalItems: items.length, totalPages: 1 });
  }),
  http.post('*/api/app/tasks/:taskId/claim', ({ params }) => {
    const id = String(params['taskId']);
    if (id.endsWith('000000000409')) {
      return HttpResponse.json(
        { title: 'Conflit', detail: 'Tâche déjà prise par un autre utilisateur.' },
        { status: 409, headers: { 'content-type': 'application/problem+json' } },
      );
    }
    const t = tasks.find((x) => x.id === id);
    if (!t) return HttpResponse.json({ title: 'Introuvable' }, { status: 404 });
    t.status = 'CLAIMED';
    t.availableActions = [{ code: 'complete', label: 'Terminer', style: 'primary' }];
    return HttpResponse.json(t);
  }),
  http.post('*/api/app/tasks/:taskId/complete', ({ params }) => {
    const t = tasks.find((x) => x.id === String(params['taskId']));
    if (!t) return HttpResponse.json({ title: 'Introuvable' }, { status: 404 });
    t.status = 'DONE';
    t.availableActions = [];
    return HttpResponse.json(t);
  }),
];
