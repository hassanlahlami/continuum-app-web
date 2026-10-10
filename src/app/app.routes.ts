import { Routes } from '@angular/router';
import { requireFeature } from './guards/require-feature.guard';
import { FindingDetailPage } from './pages/finding-detail.page';
import { FindingsPage } from './pages/findings.page';
import { MissionDetailPage } from './pages/mission-detail.page';
import { MissionsPage } from './pages/missions.page';
import { MyPermissionsPage } from './pages/my-permissions.page';

/** Routes de la Plateforme Fonctionnelle. Les gardes `canMatch` reflètent les droits (§2.1.7). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: MyPermissionsPage },
  { path: 'missions', canMatch: [requireFeature('mission.read')], component: MissionsPage },
  { path: 'missions/:id', canMatch: [requireFeature('mission.read')], component: MissionDetailPage },
  {
    path: 'missions/:missionId/findings/:findingId',
    canMatch: [requireFeature('finding.read')],
    component: FindingDetailPage,
  },
  { path: 'findings', canMatch: [requireFeature('finding.read')], component: FindingsPage },
];
