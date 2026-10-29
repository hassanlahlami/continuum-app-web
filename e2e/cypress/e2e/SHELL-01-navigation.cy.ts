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

  it('expose les repères ARIA : barre latérale nommée, navigation étiquetée', () => {
    cy.visit('/');
    cy.get('[data-cy=app-sidenav]').should('have.attr', 'role', 'region').and('have.attr', 'aria-label');
    cy.get('[data-cy=app-sidenav] .brand').should('be.visible');
    cy.get('[data-cy=app-sidenav] mat-nav-list').should('have.attr', 'aria-label', 'Menu principal');
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

  it('affiche le fil d\'Ariane de la page courante', () => {
    cy.visit('/ccm/overview');
    cy.get('[data-cy=breadcrumb]').should('contain', 'Contrôle continu').and('contain', "Vue d'ensemble");
  });

  it('nomme le bouton de repli de la navigation (libellé ARIA, icône masquée)', () => {
    cy.visit('/');
    cy.get('[data-cy=nav-toggle]').should('have.attr', 'aria-label', 'Réduire ou déployer la navigation');
    cy.get('[data-cy=nav-toggle] mat-icon').should('have.attr', 'aria-hidden', 'true');
  });

  it('contient la barre d\'application (dont le lien utilisateur) dans un repère banner', () => {
    cy.visit('/');
    cy.get('mat-toolbar.app-bar').should('have.attr', 'role', 'banner');
    cy.get('[role=banner] [data-cy=app-user]').should('exist');
  });

  it('replie et déploie la barre latérale (rail dynamique)', () => {
    cy.visit('/');
    cy.get('[data-cy=app-sidenav]').should('not.have.class', 'collapsed');
    cy.get('[data-cy=nav-toggle]').click();
    cy.get('[data-cy=app-sidenav]').should('have.class', 'collapsed');
    cy.get('[data-cy=nav-toggle]').click();
    cy.get('[data-cy=app-sidenav]').should('not.have.class', 'collapsed');
  });

  it('bascule le thème (clair / sombre)', () => {
    cy.visit('/');
    cy.get('[data-cy=theme-toggle]').click(); // auto -> clair
    cy.get('html').should('have.attr', 'data-theme', 'light');
    cy.get('[data-cy=theme-toggle]').click(); // clair -> sombre
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });
});
