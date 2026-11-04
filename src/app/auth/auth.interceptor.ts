import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthFacade, problemOf } from './auth.facade';

/**
 * Gestion des échecs d'authentification du modèle cookie (ADR 0014). Aucun jeton n'est manipulé ici :
 * le cookie de session part automatiquement (même origine) et le CSRF double-submit est posé par
 * `withXsrfConfiguration`. 401 `step-up-required` → navigation vers `/api/auth/step-up?acr=` ;
 * autre 401 → page de connexion.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthFacade);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.includes('/api/') && !req.url.includes('/api/auth/')) {
        const p = problemOf(err) as { reason?: string; requiredAcr?: number } | undefined;
        const here = router.url;
        if (p?.reason === 'step-up-required' && p.requiredAcr) {
          window.location.assign(auth.stepUpUrl(p.requiredAcr, here));
        } else if (!router.url.startsWith('/login')) {
          auth.session.set({ authenticated: false });
          void router.navigate(['/login'], { queryParams: { returnTo: here } });
        }
      }
      return throwError(() => err);
    }),
  );
};
