import { Routes } from '@angular/router';
import { MyPermissionsPage } from './pages/my-permissions.page';

/** Routes de la Plateforme Fonctionnelle. Les gardes `canMatch` par fonctionnalité viendront ensuite. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: MyPermissionsPage },
];
