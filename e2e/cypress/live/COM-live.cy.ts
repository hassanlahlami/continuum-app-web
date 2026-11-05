/** LIVE — COM-01 (login), COM-05 (profile), COM-11 (error pages) against backend + Keycloak (Code+PKCE). */
describe('LIVE COM-01 — login', () => {
  it('anonymous session is not authenticated', () => {
    cy.request('/api/auth/session?app=app').its('body.authenticated').should('eq', false);
  });
  it('login via Keycloak gives an authenticated session and the shell renders', () => {
    cy.loginKeycloak();
    cy.visit('/');
    cy.get('[data-cy=app-user]').should('be.visible');
    cy.location('pathname').should('not.include', '/login');
  });
  it('session stays authenticated across specs (cy.session cache)', () => {
    cy.loginKeycloak();
    cy.request('/api/auth/session?app=app').its('body.authenticated').should('eq', true);
  });
});

describe('LIVE COM-05 — profile', () => {
  beforeEach(() => cy.loginKeycloak());
  it('shows the identity read from /me', () => {
    cy.visit('/profile');
    cy.get('[data-cy=profile-identity]').should('exist');
    cy.get('[data-cy=profile-name]').invoke('text').should('match', /\S/);
  });
  it('theme preference is applied to <html>', () => {
    cy.visit('/profile');
    cy.get('[data-cy=profile-theme-dark]').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.get('[data-cy=profile-theme-light]').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');
  });
  it('is reachable from the top bar user block', () => {
    cy.visit('/');
    cy.get('[data-cy=app-user]').click();
    cy.location('pathname').should('eq', '/profile');
  });
});

describe('LIVE COM-11 — error pages', () => {
  beforeEach(() => cy.loginKeycloak());
  it('403 page', () => {
    cy.visit('/error/403');
    cy.get('[data-cy=error-title]').should('contain', 'Accès refusé');
  });
  it('500 page', () => {
    cy.visit('/error/500');
    cy.get('[data-cy=error-action]').should('contain', 'Réessayer');
  });
  it('unknown route gives 404 and back goes home', () => {
    cy.visit('/does/not/exist');
    cy.get('[data-cy=error-page]').should('have.attr', 'data-status', '404');
    cy.get('[data-cy=error-action]').click();
    cy.location('pathname').should('eq', '/');
  });
});
