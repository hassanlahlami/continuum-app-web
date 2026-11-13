/** MIS-02 — Nouvelle mission (assistant, D36) : accès, validation d'étape, parcours nominal. */
describe('MIS-02 — Nouvelle mission', () => {
  it('le bouton « Nouvelle mission » (mission.create) ouvre l’assistant', () => {
    cy.visit('/missions');
    cy.get('[data-cy=mission-new]').click();
    cy.url().should('include', '/missions/new');
    cy.get('[data-cy=mission-wizard]').should('exist');
  });

  it('bloque l’étape 1 tant que le formulaire est incomplet', () => {
    cy.visit('/missions/new');
    cy.get('[data-cy=mw-next-1]').click();
    cy.get('[data-cy=mw-title]').should('be.visible');
    cy.get('[data-cy=mw-next-2]').should('not.be.visible');
  });

  it('crée une mission de bout en bout puis ouvre sa fiche', () => {
    cy.visit('/missions/new');
    cy.wait(1500); // MSW + chargement des types avant d'ouvrir la liste
    cy.get('[data-cy=mw-type] .mat-mdc-select-trigger').click();
    cy.get('mat-option', { timeout: 10000 }).first().click();
    cy.get('[data-cy=mw-title]').type('Inspection agence test');
    cy.get('[data-cy=mw-next-1]').click();
    cy.get('[data-cy=mw-entity]').first().click();
    cy.get('[data-cy=mw-next-2]').click();
    cy.get('[data-cy=mw-start]').type('2026-03-02');
    cy.get('[data-cy=mw-end]').type('2026-03-20');
    cy.get('[data-cy=mw-next-3]').click();
    cy.get('[data-cy=mw-recap]').should('contain', 'Inspection agence test');
    cy.get('[data-cy=mw-submit]').click();
    cy.url().should('match', /\/missions\/[0-9a-f-]+$/);
  });
});
