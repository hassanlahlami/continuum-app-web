/**
 * MIS-01 — Missions (archétype LISTE, §8, D36). Liste servie par les mocks MSW : recherche, plage de
 * dates et « mes missions » côté serveur, reflétées dans l'URL ; lignes cliquables vers la fiche
 * (MIS-03). Sélecteurs `data-cy` uniquement.
 */
describe('MIS-01 — Missions (liste)', () => {
  it('affiche la liste des missions (parcours nominal)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=missions-table]').should('exist');
    cy.get('[data-cy=mission-row]').should('have.length', 3);
    cy.get('[data-cy=missions-table]').should('contain', 'MIS-2026-INSP-014').and('contain', 'En cours');
  });

  it('ouvre la fiche mission en cliquant une ligne (→ MIS-03)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=mission-row]').first().click();
    cy.url().should('match', /\/missions\/[0-9a-f-]+$/);
    cy.get('[data-cy=mission-title]').should('contain', 'Inspection agence A001');
  });

  it('recherche par texte libre (reflété dans l’URL, filtrage serveur)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=missions-search]').type('crédits', { force: true });
    cy.get('[data-cy=missions-apply]').click();
    cy.url().should('include', 'q=cr');
    cy.get('[data-cy=mission-row]').should('have.length', 1);
    cy.get('[data-cy=missions-table]').should('contain', 'MIS-2026-AUD-009');
  });

  it('filtre « mes missions »', () => {
    cy.visit('/missions');
    cy.get('[data-cy=mission-row]').should('have.length', 3);
    cy.get('[data-cy=missions-mine]').click();
    cy.get('[data-cy=missions-apply]').click();
    cy.url().should('include', 'mine=true');
    cy.get('[data-cy=mission-row]').should('have.length', 1);
  });
});
