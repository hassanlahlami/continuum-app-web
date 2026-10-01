import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { PermissionsStore } from '../permissions.store';

/**
 * Garde de route par fonctionnalité (plan §2.1.7) : masque une route si l'utilisateur ne détient pas
 * `featureCode`. Confort d'affichage uniquement — la vraie protection reste côté serveur (D32).
 */
export function requireFeature(featureCode: string): CanMatchFn {
  return () => {
    const store = inject(PermissionsStore);
    const router = inject(Router);
    return store.ensureLoaded().pipe(map(() => (store.has(featureCode) ? true : router.parseUrl('/'))));
  };
}
