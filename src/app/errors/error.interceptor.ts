import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorStore } from './api-error.store';

/**
 * Intercepteur d'erreurs HTTP (§10.8, §1.1) : extrait le problème RFC 9457
 * (`application/problem+json` : `title`/`detail`, `code`, `traceId`) et le publie pour affichage
 * avec sa référence, puis relaie l'erreur.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(ApiErrorStore);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // On ne signale que les erreurs de l'API Continuum (`/api/…`) ; les appels tiers gérés par la
      // librairie OIDC (découverte Keycloak `/.well-known/…`, jetons) ne doivent pas polluer le bandeau
      // d'erreur — notamment en mode mock/démo où Keycloak est absent.
      if (req.url.includes('/api/')) {
        const problem: Record<string, unknown> =
          err.error && typeof err.error === 'object' ? (err.error as Record<string, unknown>) : {};
        store.report({
          message: asString(problem['title']) ?? asString(problem['detail']) ?? err.message ?? 'Erreur',
          traceId: asString(problem['traceId']),
          code: asString(problem['code']),
          status: err.status,
        });
      }
      return throwError(() => err);
    }),
  );
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
