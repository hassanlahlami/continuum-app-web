/**
 * Support des specs live : commande `cy.loginKeycloak()` (POST /api/auth/login du BFF avec X-XSRF-TOKEN, session mise en cache). Identifiants : CYPRESS_APP_USER et CYPRESS_APP_PASSWORD (obligatoire).
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginKeycloak(): Chainable<void>;
    }
  }
}

/** Login BFF (D41) : GET /api/auth/session pose le cookie XSRF-TOKEN, puis POST /api/auth/login (X-XSRF-TOKEN) pose le cookie de session HttpOnly ; cy.session conserve les cookies. */
Cypress.Commands.add('loginKeycloak', () => {
  const user = Cypress.env('APP_USER');
  if (!user) throw new Error('CYPRESS_APP_USER is required for live specs');
  const password = Cypress.env('APP_PASSWORD');
  if (!password) throw new Error('CYPRESS_APP_PASSWORD is required for live specs');
  cy.session(
    ['bff', user],
    () => {
      cy.request('GET', '/api/auth/session')
        .then(() => cy.getCookie('XSRF-TOKEN'))
        .then((xsrf) => {
          if (!xsrf) throw new Error('XSRF-TOKEN cookie not set by GET /api/auth/session');
          return cy.request({
            method: 'POST', url: '/api/auth/login',
            headers: { 'X-XSRF-TOKEN': decodeURIComponent(xsrf.value) },
            body: { entity: Cypress.env('APP_ENTITY') ?? 'dss', username: user, password },
          });
        })
        .then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.status, 'login status').to.eq('AUTHENTICATED');
        });
      cy.visit('/');
      cy.get('[data-cy]', { timeout: 20000 }).should('exist');
    },
    { cacheAcrossSpecs: true },
  );
});

export {};
