/**
 * MIS-03 — Fiche mission / cockpit (archétype FICHE, route `/missions/:id`). Vérifie l'identité de
 * la mission, la liste de ses constats (périmètre appliqué par le serveur) et la navigation vers le
 * détail FRAP (FND-03). Servi par les mocks MSW (sans backend ni Keycloak).
 */
describe('MIS-03 — Fiche mission (cockpit)', () => {
  const mission = '9b2d7e4a-1c3f-4a6b-8d5e-7f0a1b2c3d4e';

  it('affiche l\'identité de la mission et ses constats', () => {
    cy.visit(`/missions/${mission}`);
    cy.get('[data-cy=mission-title]').should('contain', 'Inspection agence A001');
    cy.get('[data-cy=mission-findings] tbody [data-cy=finding-row]').should('have.length.at.least', 1);
  });

  it('navigue vers le détail FRAP d\'un constat (→ FND-03)', () => {
    cy.visit(`/missions/${mission}`);
    cy.get('[data-cy=finding-link]').first().click();

    cy.location('pathname').should('include', '/findings/');
    cy.get('[data-cy=finding-status]').should('contain', 'Ouvert');
    cy.get('[data-cy=finding-action-validate]').should('exist');
  });
});
