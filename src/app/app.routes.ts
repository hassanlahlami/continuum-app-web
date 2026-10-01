import { Routes } from '@angular/router';
import { requireFeature } from './guards/require-feature.guard';
import { MissionsPage } from './pages/missions.page';
import { MyPermissionsPage } from './pages/my-permissions.page';

/** Routes de la Plateforme Fonctionnelle. Les gardes `canMatch` reflètent les droits (§2.1.7). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: MyPermissionsPage },
  { path: 'missions', canMatch: [requireFeature('mission.read')], component: MissionsPage },
];
