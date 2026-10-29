/**
 * FND-03 — FRAP : revue et validation (archétype FICHE, route `/missions/:missionId/findings/:findingId`).
 * Parcours nominal + cas refusés, servis par les mocks MSW (sans backend ni Keycloak).
 * Règle SoD centrale : l'auteur ne peut pas valider ; le serveur décide, le front n'affiche que
 * ce que renvoie `availableActions` et les refus (403/409) deviennent un message clair.
 */
describe('FND-03 — FRAP : revue et validation', () => {
  const mission = 'a0000000-0000-0000-0000-0000000000a1';
  const openFinding = 'c1a2b3d4-0000-0000-0000-000000000001';
  const sodFinding = 'c1a2b3d4-0000-0000-0000-000000000409';
  const forbiddenFinding = 'c1a2b3d4-0000-0000-0000-000000000403';

  it('affiche la FRAP et valide un constat ouvert', () => {
    cy.visit(`/missions/${mission}/findings/${openFinding}`);
    cy.get('[data-cy=finding-status]').should('contain', 'Ouvert');
    cy.get('[data-cy=finding-action-validate]').should('contain', 'Valider').click();

    cy.get('[data-cy=finding-status]').should('contain', 'Validé');
    cy.get('[data-cy=finding-action-validate]').should('not.exist');
    cy.get('[data-cy=finding-action-error]').should('not.exist');
  });

  it('affiche le contenu enrichi (preuves et commentaires de revue)', () => {
    cy.visit(`/missions/${mission}/findings/${openFinding}`);
    cy.get('[data-cy=finding-evidences]').should('contain', 'extrait-mouvements-A001.pdf').and('contain', 'Ko');
    cy.get('[data-cy=finding-reviews]')
      .should('contain', 'Omar Haddad')
      .and('contain', 'À traiter')
      .and('contain', 'Résolu');
  });

  it("affiche l'historique du constat", () => {
    cy.visit(`/missions/${mission}/findings/${openFinding}`);
    cy.get('[data-cy=finding-history]')
      .should('contain', 'Création')
      .and('contain', 'Omar Haddad')
      .and('contain', 'Précisez la cause racine.');
  });

  it('montre un message clair quand la SoD dynamique bloque la validation (409)', () => {
    cy.visit(`/missions/${mission}/findings/${sodFinding}`);
    cy.get('[data-cy=finding-action-validate]').click();

    cy.get('[data-cy=finding-action-error]').should('contain', 'SoD');
    cy.get('[data-cy=finding-status]').should('contain', 'Ouvert');
  });

  it('montre un message quand le droit de validation manque (403)', () => {
    cy.visit(`/missions/${mission}/findings/${forbiddenFinding}`);
    cy.get('[data-cy=finding-action-validate]').click();

    cy.get('[data-cy=finding-action-error]').should('contain', 'autoris');
    cy.get('[data-cy=finding-status]').should('contain', 'Ouvert');
  });
});
