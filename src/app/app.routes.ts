import { Routes } from '@angular/router';
import { requireFeature } from './guards/require-feature.guard';
import { CcmControlDetailPage } from './pages/ccm-control-detail.page';
import { CcmControlsPage } from './pages/ccm-controls.page';
import { CcmExceptionDetailPage } from './pages/ccm-exception-detail.page';
import { CcmExceptionsPage } from './pages/ccm-exceptions.page';
import { CcmOverviewPage } from './pages/ccm-overview.page';
import { FindingDetailPage } from './pages/finding-detail.page';
import { FindingsPage } from './pages/findings.page';
import { MissionDetailPage } from './pages/mission-detail.page';
import { MissionsPage } from './pages/missions.page';
import { MyPermissionsPage } from './pages/my-permissions.page';
import { ProfilePage } from './pages/profile.page';

/**
 * Routes de la Plateforme Fonctionnelle. Les gardes `canMatch` reflètent les droits (§2.1.7) ;
 * `data.crumb` alimente le fil d'Ariane de la coquille (orientation dans la toolbar).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: MyPermissionsPage, data: { crumb: ['Accueil'] } },
  { path: 'profile', component: ProfilePage, data: { crumb: ['Profil & préférences'] } },
  { path: 'missions', canMatch: [requireFeature('mission.read')], component: MissionsPage, data: { crumb: ['Missions'] } },
  {
    path: 'missions/:id',
    canMatch: [requireFeature('mission.read')],
    component: MissionDetailPage,
    data: { crumb: ['Missions', 'Fiche mission'] },
  },
  {
    path: 'missions/:missionId/findings/:findingId',
    canMatch: [requireFeature('finding.read')],
    component: FindingDetailPage,
    data: { crumb: ['Missions', 'Constat'] },
  },
  { path: 'findings', canMatch: [requireFeature('finding.read')], component: FindingsPage, data: { crumb: ['Constats'] } },
  { path: 'ccm', canMatch: [requireFeature('ccm.read')], component: CcmExceptionsPage, data: { crumb: ['Contrôle continu', "Flux d'exceptions"] } },
  { path: 'ccm/overview', canMatch: [requireFeature('ccm.read')], component: CcmOverviewPage, data: { crumb: ['Contrôle continu', "Vue d'ensemble"] } },
  { path: 'ccm/controls', canMatch: [requireFeature('ccm.read')], component: CcmControlsPage, data: { crumb: ['Contrôle continu', 'Bibliothèque'] } },
  {
    path: 'ccm/controls/:controlId',
    canMatch: [requireFeature('ccm.read')],
    component: CcmControlDetailPage,
    data: { crumb: ['Contrôle continu', 'Bibliothèque', 'Fiche contrôle'] },
  },
  {
    path: 'ccm/exceptions/:exceptionId',
    canMatch: [requireFeature('ccm.read')],
    component: CcmExceptionDetailPage,
    data: { crumb: ['Contrôle continu', 'Exception'] },
  },
];
