/**
 * Support des specs live : commande `cy.loginKeycloak()` (direct grant du client de test dev-only `continuum-app-e2e`, session mise en cache). Identifiants (jamais en dur) : CYPRESS_APP_USER et CYPRESS_APP_PASSWORD (obligatoire).
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginKeycloak(): Chainable<void>;
    }
  }
}

/** Login sans navigation vers Keycloak (évite HSTS/cy.origin) : direct grant du client de test dev-only (simulation uniquement), tokens injectés là où angular-oauth2-oidc les lit. */
Cypress.Commands.add('loginKeycloak', () => {
  const user = Cypress.env('APP_USER');
  if (!user) throw new Error('CYPRESS_APP_USER is required for live specs');
  const password = Cypress.env('APP_PASSWORD');
  if (!password) throw new Error('CYPRESS_APP_PASSWORD is required for live specs');
  const oidc = `${Cypress.env('KEYCLOAK_ORIGIN')}/realms/banque-demo/protocol/openid-connect`;
  cy.session(
    ['keycloak', user],
    () => {
      cy.request({
        method: 'POST', url: `${oidc}/token`, form: true,
        body: { grant_type: 'password', client_id: 'continuum-app-e2e', scope: 'openid profile email', username: user, password },
      }).then((tok) => {
        const t = tok.body;
        const now = Date.now();
        const claims = JSON.parse(atob(t.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        cy.visit('/', { onBeforeLoad: (win) => {
          const s = win.sessionStorage;
          s.setItem('access_token', t.access_token);
          s.setItem('id_token', t.id_token);
          if (t.refresh_token) s.setItem('refresh_token', t.refresh_token);
          s.setItem('expires_at', String(now + t.expires_in * 1000));
          s.setItem('access_token_stored_at', String(now));
          s.setItem('id_token_stored_at', String(now));
          s.setItem('id_token_expires_at', String(claims.exp * 1000));
          s.setItem('id_token_claims_obj', JSON.stringify(claims));
          s.setItem('granted_scopes', JSON.stringify(String(t.scope).split(' ')));
        } });
        cy.get('[data-cy]', { timeout: 20000 }).should('exist');
      });
    },
    { cacheAcrossSpecs: true },
  );
});

export {};
