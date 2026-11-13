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
type Front = 'app' | 'admin';
/** Une session par front (cookies `CT_SESSION` / `CT_ADMIN_SESSION` distincts, auth.yaml v0.2.0). */
const sessions: Record<Front, SessionState> = { app: { authenticated: false }, admin: { authenticated: false } };
const frontOf = (v: unknown): Front => (v === 'admin' ? 'admin' : 'app');
let lastChallenge: string | undefined;
let challengeFront: Front = 'app';

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

const problemJson = (status: number, title: string) =>
  HttpResponse.json({ type: 'about:blank', title, status }, { status, headers: { 'Content-Type': 'application/problem+json' } });

const csrfOk = (req: Request) => req.headers.get('X-XSRF-TOKEN') === XSRF;
const open = (front: Front) => {
  sessions[front] = authenticatedSessionFixture;
  return HttpResponse.json({ status: 'AUTHENTICATED', session: sessions[front] });
};

/** Remet la session mock à zéro (tests). */
export function resetAuthMock(): void {
  sessions.app = { authenticated: false };
  sessions.admin = { authenticated: false };
  lastChallenge = undefined;
  challengeFront = 'app';
}

export const authHandlers = [
  http.get('*/api/auth/options', ({ request }) => {
    // Les handlers MSW tournent dans la page : un test peut forcer le mode via `window.__ctMock.loginMode`.
    const url = new URL(request.url);
    if (url.searchParams.get('entity') === 'unknown') return problemJson(404, 'Tenant introuvable');
    const forced = (globalThis as { __ctMock?: { loginMode?: string } }).__ctMock?.loginMode;
    // `admin` n'est jamais proposé en `rest` (ADR 0014 avenant) : redirect par défaut.
    const redirect = forced === 'redirect' || url.searchParams.get('app') === 'admin';
    return HttpResponse.json(redirect ? { ...loginOptionsFixture, mode: 'redirect' } : loginOptionsFixture);
  }),
  http.get('*/api/auth/session', ({ request }) => {
    if (typeof document !== 'undefined') {
      document.cookie = `XSRF-TOKEN=${XSRF}; path=/; SameSite=Strict`;
    }
    return HttpResponse.json(sessions[frontOf(new URL(request.url).searchParams.get('app'))]);
  }),
  http.post('*/api/auth/login', async ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    const body = (await request.json()) as LoginRequest;
    const front = frontOf(body.app);
    switch (body.username) {
      case 'ratelimited':
        return problem(429, 'rate-limited', 'Trop de tentatives', { 'Retry-After': '30' });
      case 'mfa':
        challengeFront = front;
        lastChallenge = '9c1f3a52-7d0e-4b1e-8a64-2f5d6e7a8b90';
        return HttpResponse.json({ status: 'MFA_REQUIRED', challengeId: lastChallenge, methods: ['otp'] });
      case 'action':
        return HttpResponse.json({ status: 'ACTION_REQUIRED', redirectUrl: '/api/auth/authorize?returnTo=/' });
      case 'locked':
        return problem(401, 'invalid-credentials', 'Identifiants invalides');
      default:
        return body.password === 'demo' ? open(front) : problem(401, 'invalid-credentials', 'Identifiants invalides');
    }
  }),
  http.post('*/api/auth/mfa', async ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    const body = (await request.json()) as MfaRequest;
    return body.challengeId === lastChallenge && body.code === '123456'
      ? open(challengeFront)
      : problem(401, 'invalid-credentials', 'Code invalide');
  }),
  http.post('*/api/auth/logout', ({ request }) => {
    if (!csrfOk(request)) return problem(403, 'csrf-invalid', 'Jeton CSRF invalide');
    sessions[frontOf(new URL(request.url).searchParams.get('app'))] = { authenticated: false };
    return new HttpResponse(null, { status: 204 });
  }),
];
