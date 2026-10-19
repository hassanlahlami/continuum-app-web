/**
 * MIS-01 — Missions (archétype LISTE, §8, D36). Liste servie par les mocks MSW (sans backend) :
 * recherche et pagination côté serveur reflétées dans l'URL (`?q=&page=`), lignes cliquables vers la
 * fiche (MIS-03). Sélecteurs `data-cy` uniquement.
 */
describe('MIS-01 — Missions (liste)', () => {
  it('affiche la liste des missions (parcours nominal)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=missions-table]').should('exist');
    cy.get('[data-cy=mission-row]').should('have.length.at.least', 1);
    cy.get('[data-cy=missions-table]')
      .should('contain', 'MIS-2026-INSP-014')
      .and('contain', 'Inspection agence A001')
      .and('contain', 'En cours')
      .and('contain', '40%');
  });

  it('ouvre la fiche mission en cliquant une ligne (→ MIS-03)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=mission-row]').first().click();
    cy.url().should('match', /\/missions\/[0-9a-f-]+$/);
    cy.get('[data-cy=mission-title]').should('contain', 'Inspection agence A001');
  });

  it('reflète la recherche dans l’URL (filtrage côté serveur)', () => {
    cy.visit('/missions');
    cy.get('[data-cy=missions-search]').clear().type('agence');
    cy.get('[data-cy=missions-search]').parents('form').submit();
    cy.url().should('include', 'q=agence');
    // le serveur (mock) décide du contenu ; la page reste rendue
    cy.get('[data-cy=missions-table]').should('exist');
  });
});
