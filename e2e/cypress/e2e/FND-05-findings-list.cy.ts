/**
 * FND-05 — Constats : vue transverse (archétype LISTE, route `/findings`). Tous les constats du
 * périmètre (`GET /findings`, feature `finding.read`) avec filtres multicritères côté serveur reflétés
 * dans l'URL. Servi par les mocks MSW. Sélecteurs `data-cy` uniquement (D36).
 */
describe('FND-05 — Constats : vue transverse', () => {
  it('liste les constats du périmètre', () => {
    cy.visit('/findings');
    cy.get('[data-cy=findings-table] [data-cy=finding-row]').should('have.length', 4);
    cy.contains('[data-cy=finding-row]', 'FND-2026-INSP-014-001');
  });

  it('filtre par source (CCM) — reflété dans l’URL, filtrage serveur', () => {
    cy.visit('/findings');
    cy.get('[data-cy=findings-source]').click();
    cy.get('mat-option').contains('Contrôle continu').click();
    cy.get('[data-cy=findings-apply]').click();
    cy.url().should('include', 'source=CCM');
    cy.get('[data-cy=finding-row]').should('have.length', 2);
  });

  it('recherche par texte libre', () => {
    cy.visit('/findings');
    cy.get('[data-cy=findings-q]').type('dormant', { force: true });
    cy.get('[data-cy=findings-apply]').click();
    cy.url().should('include', 'q=dormant');
    cy.get('[data-cy=finding-row]').should('have.length', 1);
    cy.get('[data-cy=findings-table]').should('contain', 'FND-2026-INSP-014-002');
  });

  it('réinitialise les filtres', () => {
    cy.visit('/findings?source=CCM');
    cy.get('[data-cy=finding-row]').should('have.length', 2);
    cy.get('[data-cy=findings-reset]').click();
    cy.get('[data-cy=finding-row]').should('have.length', 4);
  });
});
