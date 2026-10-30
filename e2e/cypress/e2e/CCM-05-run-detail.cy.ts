/**
 * CCM-05 — Détail d'une exécution CCM (route `/ccm/runs/:id`, §5) : population testée, exceptions, durée,
 * source de données, paramètres, cause d'échec. Lecture seule ; accès depuis la fiche contrôle. Mocks MSW.
 */
describe("CCM-05 — Détail d'une exécution", () => {
  const CONTROL_ID = 'cc100000-0000-0000-0000-000000000002';
  const OK_RUN = 'run00000-0000-0000-0000-000000000002';
  const KO_RUN = 'run00000-0000-0000-0000-000000000001';

  it("ouvre le détail depuis l'historique du contrôle", () => {
    cy.visit(`/ccm/controls/${CONTROL_ID}`);
    cy.get('[data-cy=ccm-run-link]').first().click();
    cy.url().should('include', `/ccm/runs/${OK_RUN}`);
    cy.get('[data-cy=ccm-run-control]').should('contain', 'hors seuil');
  });

  it('affiche population, exceptions, durée et source', () => {
    cy.visit(`/ccm/runs/${OK_RUN}`);
    cy.get('[data-cy=ccm-run-detail-status]').should('contain', 'Réussie');
    cy.get('[data-cy=ccm-run-population]').should('contain', '1200');
    cy.get('[data-cy=ccm-run-exceptions]').should('contain', '2');
    cy.get('[data-cy=ccm-run-duration]').should('contain', '12 s');
    cy.get('[data-cy=ccm-run-source]').should('contain', 'amplitude-sim');
    cy.get('[data-cy=ccm-run-params]').should('contain', 'thresholdAmount');
  });

  it("affiche la cause d'une exécution en échec", () => {
    cy.visit(`/ccm/runs/${KO_RUN}`);
    cy.get('[data-cy=ccm-run-detail-status]').should('contain', 'En échec');
    cy.get('[data-cy=ccm-run-problem]').should('contain', 'connexion CBS perdue');
  });

  it('signale une exécution introuvable', () => {
    cy.visit('/ccm/runs/inconnu');
    cy.get('[data-cy=ccm-run-notfound]').should('be.visible');
  });
});
