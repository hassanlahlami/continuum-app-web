import { http, HttpResponse } from 'msw';
import type { AuthProblem, LoginOptions, LoginRequest, MfaRequest, SessionState } from '../api-clients/auth';

/**
 * Mocks MSW du BFF d'authentification (D41, contracts/openapi/public/auth.yaml). La session vit dans la
 * mémoire du handler (pas de cookie HttpOnly côté navigateur en mock) ; le cookie `XSRF-TOKEN` lisible est
 * posé par `GET /session` quand un `document` existe. Identifiants de démonstration :
 *  - `locked` / `ratelimited` / `mfa` / `action` déclenchent 401 / 429 / MFA_REQUIRED / ACTION_REQUIRED ;
 *  - tout autre identifiant avec le mot de passe `demo` ouvre la session ; sinon 401 invalid-credentials.
 * Code OTP valide : `123456`.
 */
const XSRF = 'mock-xsrf-token';
let session: SessionState = { authenticated: false };
let lastChallenge: string | undefined;

export const loginOptionsFixture: LoginOptions = {
  mode: 'rest',
  ssoProviders: [{ alias: 'entreprise', label: { fr: 'SSO entreprise', en: 'Enterprise SSO' } }],
  mfaMethods: ['otp'],
};

export const authenticatedSessionFixture: SessionState = {
  authenticated: true,
  userId: '00000000-0000-0000-0000-0000000000aa',
  displayName: 'Inspecteur Un',
  acr: 1,
  expiresAt: '2026-11-02T20:00:00Z',
  idleTimeoutSeconds: 1800,
};

const problem = (status: number, reason: AuthProblem['reason'], title: string, headers: Record<string, string> = {}) =>
  HttpResponse.json(
    { type: `https://continuum.local/problems/${reason}`, title, status, reason, traceId: '4bf92f3577b34da6a3ce929d0e0e4736' } satisfies AuthProblem,
    { status, headers: { 'Content-Type': 'application/problem+json', ...headers } },
  );

const csrfOk = (req: Request) => req.headers.get('X-XSRF-TOKEN') === XSRF;
const open = () => {
  session = authenticatedSessionFixture;
  return HttpResponse.json({ status: 'AUTHENTICATED', session });
};

/** Remet la session mock à zéro (tests). */
export function resetAuthMock(): void {
  session = { authenticated: false };
  lastChallenge = undefined;
}

export const authHandlers = [
  http.get('*/api/auth/options', ({ request }) => {
    // Les handlers MSW tournent dans la page : un test peut forcer le mode via `window.__ctMock.loginMode`.
    const forced = (globalThis as { __ctMock?: { loginMode?: string } }).__ctMock?.loginMode;
    return HttpResponse.json(forced === 'redirect' ? { ...loginOptionsFixture, mode: 'redirect' } : loginOptionsFixture);
  }),
  http.get('*/api/auth/session', () => {
    if (typeof document !== 'undefined') {
      document.cookie = `XSRF-TOKEN=${XSRF}; path=/; SameSite=Strict`;
    }
    return HttpResponse.json(session);
  }),
  http.post('*/api/auth/login', async ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    const body = (await request.json()) as LoginRequest;
    switch (body.username) {
      case 'ratelimited':
        return problem(429, 'rate-limited', 'Trop de tentatives', { 'Retry-After': '30' });
      case 'mfa':
        lastChallenge = '9c1f3a52-7d0e-4b1e-8a64-2f5d6e7a8b90';
        return HttpResponse.json({ status: 'MFA_REQUIRED', challengeId: lastChallenge, methods: ['otp'] });
      case 'action':
        return HttpResponse.json({ status: 'ACTION_REQUIRED', redirectUrl: '/api/auth/authorize?returnTo=/' });
      case 'locked':
        return problem(401, 'invalid-credentials', 'Identifiants invalides');
      default:
        return body.password === 'demo' ? open() : problem(401, 'invalid-credentials', 'Identifiants invalides');
    }
  }),
  http.post('*/api/auth/mfa', async ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    const body = (await request.json()) as MfaRequest;
    return body.challengeId === lastChallenge && body.code === '123456'
      ? open()
      : problem(401, 'invalid-credentials', 'Code invalide');
  }),
  http.post('*/api/auth/logout', ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    session = { authenticated: false };
    return new HttpResponse(null, { status: 204 });
  }),
];
