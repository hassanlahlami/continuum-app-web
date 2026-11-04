import { TasksPage } from './pages/tasks.page';
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { requireFeature } from './guards/require-feature.guard';
import { CcmControlDetailPage } from './pages/ccm-control-detail.page';
import { CcmControlsPage } from './pages/ccm-controls.page';
import { CcmExceptionDetailPage } from './pages/ccm-exception-detail.page';
import { CcmExceptionsPage } from './pages/ccm-exceptions.page';
import { CcmOverviewPage } from './pages/ccm-overview.page';
import { CcmRunDetailPage } from './pages/ccm-run-detail.page';
import { ErrorPage } from './pages/error.page';
import { FindingDetailPage } from './pages/finding-detail.page';
import { FindingsPage } from './pages/findings.page';
import { LoginPage } from './pages/login.page';
import { MissionDetailPage } from './pages/mission-detail.page';
import { MissionsPage } from './pages/missions.page';
import { MyPermissionsPage } from './pages/my-permissions.page';
import { ProfilePage } from './pages/profile.page';

/**
 * Routes de la Plateforme Fonctionnelle. Les gardes `canMatch` refl猫tent les droits (搂2.1.7) ;
 * `data.crumb` alimente le fil d'Ariane de la coquille (orientation dans la toolbar).
 */
const guarded: Routes = [
  { path: '', pathMatch: 'full', component: MyPermissionsPage, data: { crumb: ['Accueil'] } },
  { path: 'tasks', component: TasksPage, data: { crumb: ['Mes t鈉hes'] } },
  { path: 'profile', component: ProfilePage, data: { crumb: ['Profil & pr茅f茅rences'] } },
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
  { path: 'ccm', canMatch: [requireFeature('ccm.read')], component: CcmExceptionsPage, data: { crumb: ['Contr么le continu', "Flux d'exceptions"] } },
  { path: 'ccm/overview', canMatch: [requireFeature('ccm.read')], component: CcmOverviewPage, data: { crumb: ['Contr么le continu', "Vue d'ensemble"] } },
  { path: 'ccm/controls', canMatch: [requireFeature('ccm.read')], component: CcmControlsPage, data: { crumb: ['Contr么le continu', 'Biblioth猫que'] } },
  {
    path: 'ccm/controls/:controlId',
    canMatch: [requireFeature('ccm.read')],
    component: CcmControlDetailPage,
    data: { crumb: ['Contr么le continu', 'Biblioth猫que', 'Fiche contr么le'] },
  },
  {
    path: 'ccm/runs/:runId',
    canMatch: [requireFeature('ccm.read')],
    component: CcmRunDetailPage,
    data: { crumb: ['Contr鬺e continu', 'Ex閏ution'] },
  },
  {
    path: 'ccm/exceptions/:exceptionId',
    canMatch: [requireFeature('ccm.read')],
    component: CcmExceptionDetailPage,
    data: { crumb: ['Contr么le continu', 'Exception'] },
  },
];

export const routes: Routes = [
  { path: 'login', component: LoginPage, data: { crumb: ['Connexion'] } },
  { path: '', canActivateChild: [authGuard], children: guarded },
  { path: 'error/:status', component: ErrorPage, data: { crumb: ['Erreur'] } },
  { path: '**', component: ErrorPage, data: { status: 404, crumb: ['Erreur'] } },
];
