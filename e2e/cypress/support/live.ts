/**
 * Support des specs live : `cy.loginKeycloak()` (Code+PKCE via le BFF, TOTP, cy.session). Env : CYPRESS_SIM_USERNAME, CYPRESS_SIM_USER_PASSWORD, CYPRESS_SIM_TOTP_SECRET_BASE32.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginKeycloak(): Chainable<void>;
    }
  }
}

/**
 * Login Code+PKCE app (ADR 0014) : GET /api/auth/authorize?app=app ; la page Keycloak (cross-origin)
 * est pilotée par cy.request (sans cy.origin) : formulaires soumis à la main, puis code username/password puis le code TOTP calculé ici. Secrets uniquement via l'environnement
 * (CYPRESS_SIM_USERNAME, CYPRESS_SIM_USER_PASSWORD, CYPRESS_SIM_TOTP_SECRET_BASE32), jamais committés.
 * Keycloak refuse un code réutilisé dans la même fenêtre de 30 s : on attend la fenêtre suivante entre deux logins.
 */
let lastWindow = -1;
/** Session must be authenticated (a bare 200 also comes back when anonymous). */
const assertAuthenticated = () => {
  cy.request('/api/auth/session?app=app').then((r) => {
    expect(r.status).to.eq(200);
    expect(r.body.authenticated, 'authenticated').to.eq(true);
  });
};
Cypress.Commands.add('loginKeycloak', () => {
  const username = Cypress.env('SIM_USERNAME') ?? 'dsi.admin';
  const password = Cypress.env('SIM_USER_PASSWORD');
  const secret = Cypress.env('SIM_TOTP_SECRET_BASE32');
  if (!password || !secret) throw new Error('CYPRESS_SIM_USER_PASSWORD and CYPRESS_SIM_TOTP_SECRET_BASE32 are required for live specs');
  cy.session(
    ['bff-code-app', username],
    () => {
      const entity = Cypress.env('APP_ENTITY') ?? 'BANQUE-DEMO';
      // Code+PKCE driven with cy.request (no cy.origin): follow redirects by hand, submit Keycloak's HTML forms.
      const kc = Cypress.env('SIM_KC_URL') ?? 'http://localhost:8180';
      const formAction = (html: string) => {
        const m = /<form[^>]*action="([^"]+)"/.exec(html);
        if (!m) throw new Error('Keycloak form not found');
        return m[1].replace(/&amp;/g, '&');
      };
      // follow 3xx until the BFF callback lands back on the app (cookies are kept by the browser jar)
      const follow = (url: string): Cypress.Chainable<any> =>
        cy.request({ url, followRedirect: false, failOnStatusCode: false }).then((r) => {
          const loc = r.headers['location'] as string | undefined;
          if (r.status >= 300 && r.status < 400 && loc) return follow(new URL(loc, url).toString());
          return cy.wrap(r);
        });
      const base = Cypress.config('baseUrl') as string;
      cy.request({ url: `${base}/api/auth/authorize?app=app&entity=${entity}&returnTo=%2F`, followRedirect: false })
        .then((r) => new URL(r.headers['location'] as string, base).toString())
        .then((loginUrl) => cy.request({ url: loginUrl }))
        .then((page) =>
          cy.request({ method: 'POST', url: formAction(page.body as string), form: true, followRedirect: false,
            body: { username, password, credentialId: '' } }),
        )
        .then((r) => {
          // Keycloak answers 200 with the OTP form inline, or 302 to it
          const loc = r.headers['location'] as string | undefined;
          // No step-up for the app client: Keycloak may redirect straight back to the BFF callback (no OTP form)
          if (loc && new URL(loc, kc).origin !== new URL(kc).origin) return follow(new URL(loc, kc).toString());
          return loc ? cy.request({ url: new URL(loc, kc).toString() }) : cy.wrap(r);
        })
        .then((otpPage) => {
          if (!/<form/.test(String(otpPage.body))) return cy.wrap(otpPage);
          const action = formAction(otpPage.body as string);
          const win = Math.floor(Date.now() / 30000);
          const wait = win <= lastWindow ? 30000 - (Date.now() % 30000) + 500 : 0; // code reuse refused per window
          return cy.wait(wait, { log: false })
            .then(() => cy.wrap(import('otplib').then((m) => m.generate({ secret })), { log: false }))
            .then((code) => {
              lastWindow = Math.floor(Date.now() / 30000);
              return cy.request({ method: 'POST', url: action, form: true, followRedirect: false,
                body: { otp: code, login: 'Sign In' }, log: false });
            });
        })
        .then((r) => (r.headers['location'] ? follow(new URL(r.headers['location'] as string, kc).toString()) : cy.wrap(r)));
      assertAuthenticated();
    },
    { cacheAcrossSpecs: true, validate: assertAuthenticated },
  );
});

export {};
