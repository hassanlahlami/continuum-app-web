import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthFacade } from './auth.facade';

/** L'administration exige une session (§4.5) : sinon redirection vers `/login?returnTo=`. */
export const authGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const toLogin = () => router.createUrlTree(['/login'], { queryParams: { returnTo: state.url } });
  if (environment.useMocks) return true; // mocks MSW : pas de session réelle
  if (auth.session().authenticated) return true;
  return auth.refresh().pipe(
    map((s) => (s.authenticated ? true : toLogin())),
    catchError(() => of(toLogin())),
  );
};
