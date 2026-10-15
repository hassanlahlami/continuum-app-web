/**
 * SHELL-01 — Coquille applicative & navigation (§1.2). Barre latérale « cockpit » : navigation groupée
 * filtrée par les droits effectifs (§2.1.7), surbrillance de la route active, navigation vers les pages.
 * Mocks MSW (droits : mission.read, finding.read, ccm.read…).
 */
describe('SHELL-01 — Coquille & navigation', () => {
  beforeEach(() => cy.viewport(1280, 800)); // layout desktop : barre latérale en mode « side »

  it('affiche la barre latérale et la navigation autorisée', () => {
    cy.visit('/');
    cy.get('[data-cy=app-sidenav]').should('be.visible');
    cy.get('[data-cy=app-user]').should('be.visible');
    cy.get('[data-cy="nav-/missions"]').should('exist');
    cy.get('[data-cy="nav-/findings"]').should('exist');
    cy.get('[data-cy="nav-/ccm/overview"]').should('exist');
    cy.get('[data-cy="nav-/ccm/controls"]').should('exist');
  });

  it('navigue vers une page via la barre latérale', () => {
    cy.visit('/');
    cy.get('[data-cy="nav-/ccm/controls"]').click();
    cy.location('pathname').should('eq', '/ccm/controls');
    cy.get('[data-cy=ccm-controls-table]').should('exist');
  });

  it('surligne la route active', () => {
    cy.visit('/findings');
    cy.get('[data-cy="nav-/findings"]').should('have.class', 'active-nav');
  });
});
