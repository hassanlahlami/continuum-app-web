import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

/**
 * Ajoute le jeton d'accès (Bearer) aux appels de l'API (plan §4.3.3). Le front ne décide rien :
 * il transmet le jeton émis par Keycloak ; le backend valide et autorise.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(OAuthService).getAccessToken();
  if (token && req.url.includes('/api/')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
