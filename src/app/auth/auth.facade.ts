import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Observable, catchError, switchMap, tap, throwError } from 'rxjs';
import {
  AuthProblem,
  LoginOptions,
  LoginResult,
  LoginService,
  OptionsService,
  SessionService,
  SessionState,
} from '../../../libs/api-clients/auth';

/** Code du tenant (issu de `config.json`) transmis au BFF ; à défaut, il résout par le nom d'hôte. */
export const AUTH_ENTITY = new InjectionToken<string>('AUTH_ENTITY', { providedIn: 'root', factory: () => '' });

/** Valeur du cookie `XSRF-TOKEN` (double-submit, D41) — jamais stockée ailleurs que dans le cookie. */
export function readXsrfCookie(): string {
  const m = /(?:^|;\s*)XSRF-TOKEN=([^;]*)/.exec(document.cookie);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Route interne uniquement (anti open-redirect) : relative, sans `//` ni antislash. */
export function safeReturnTo(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/';
}

/** Problème d'authentification porté par une erreur HTTP, si le corps en est un. */
export function problemOf(err: unknown): AuthProblem | undefined {
  const body = err instanceof HttpErrorResponse ? err.error : undefined;
  return body && typeof body === 'object' && 'reason' in body ? (body as AuthProblem) : undefined;
}

/**
 * Façade du BFF d'authentification (D41) : cookie de session HttpOnly + CSRF double-submit, même origine.
 * Aucun jeton côté navigateur. Un 403 `csrf-invalid` relit le cookie (via `GET /session`) et rejoue une fois.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly loginApi = inject(LoginService);
  private readonly sessionApi = inject(SessionService);
  private readonly optionsApi = inject(OptionsService);
  private readonly entity = inject(AUTH_ENTITY) || undefined;

  readonly session = signal<SessionState>({ authenticated: false });

  options(app: 'app' | 'admin' = 'app'): Observable<LoginOptions> {
    return this.optionsApi.getLoginOptions(app, this.entity);
  }

  /** Charge l'état de session et pose le cookie CSRF. */
  refresh(): Observable<SessionState> {
    return this.sessionApi.getSession().pipe(tap((s) => this.session.set(s)));
  }

  signIn(username: string, password: string): Observable<LoginResult> {
    return this.withCsrfRetry(() =>
      this.loginApi.login(readXsrfCookie(), { entity: this.entity, username, password }),
    ).pipe(tap((r) => this.track(r)));
  }

  verifyMfa(challengeId: string, code: string): Observable<LoginResult> {
    return this.withCsrfRetry(() => this.loginApi.verifyMfa(readXsrfCookie(), { challengeId, code })).pipe(
      tap((r) => this.track(r)),
    );
  }

  signOut(): Observable<unknown> {
    return this.withCsrfRetry(() => this.sessionApi.logout(readXsrfCookie())).pipe(
      tap(() => this.session.set({ authenticated: false })),
    );
  }

  /** Navigation (pas XHR) vers le Code + PKCE terminé par le BFF. */
  redirectLoginUrl(returnTo: string, idp?: string): string {
    const q = new URLSearchParams({ returnTo: safeReturnTo(returnTo) });
    if (this.entity) q.set('entity', this.entity);
    if (idp) q.set('idp', idp);
    return `/api/auth/authorize?${q.toString()}`;
  }

  /** Navigation (pas XHR) vers le step-up (`acr` supérieur), terminé par le BFF. */
  stepUpUrl(acr: number, returnTo: string): string {
    return `/api/auth/step-up?${new URLSearchParams({ acr: String(acr), returnTo: safeReturnTo(returnTo) })}`;
  }

  private track(r: LoginResult): void {
    if (r.status === 'AUTHENTICATED') this.session.set(r.session);
  }

  private withCsrfRetry<T>(call: () => Observable<T>): Observable<T> {
    return call().pipe(
      catchError((err: HttpErrorResponse) =>
        problemOf(err)?.reason === 'csrf-invalid'
          ? this.sessionApi.getSession().pipe(switchMap(() => call()))
          : throwError(() => err),
      ),
    );
  }
}
