/**
 * COM-11 — Pages d'erreur (403, 404, 500) : message adapté, action unique, route inconnue → 404,
 * route sans droit → 403 (sans nommer la fonctionnalité manquante).
 */
describe('COM-11 — Pages d’erreur', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('affiche le 403', () => {
    cy.visit('/error/403');
    cy.get('[data-cy=error-title]').should('contain', 'Accès refusé');
    cy.get('[data-cy=error-action]').should('contain', 'accueil');
  });

  it('affiche le 500 avec une action « Réessayer »', () => {
    cy.visit('/error/500');
    cy.get('[data-cy=error-title]').should('contain', 'Erreur inattendue');
    cy.get('[data-cy=error-action]').should('contain', 'Réessayer');
  });

  it('une route inconnue donne le 404 et le retour mène à l’accueil', () => {
    cy.visit('/does/not/exist');
    cy.get('[data-cy=error-page]').should('have.attr', 'data-status', '404');
    cy.get('[data-cy=error-action]').click();
    cy.location('pathname').should('eq', '/');
  });
});
