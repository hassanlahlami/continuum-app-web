/**
 * COM-04 — Accueil (route `/`) : ici « Mes droits » (archétype proche de TABLEAU DE BORD, §1.5/§8).
 * Liste les fonctionnalités effectives (`/me/permissions`) et la navigation filtrée par les droits
 * (`*hasFeature`). Servi par les mocks MSW.
 */
describe('COM-04 — Accueil / Mes droits', () => {
  it('affiche le bandeau d\'accueil avec l\'identité de l\'utilisateur', () => {
    cy.visit('/');
    cy.get('[data-cy=home-greeting]').should('contain', 'Inspecteur Un');
    cy.get('[data-cy=home-hero]').should('contain', 'Banque Démo').and('contain', 'Inspection Générale');
  });

  it('affiche les droits effectifs et la navigation filtrée', () => {
    cy.visit('/');
    cy.get('[data-cy=permission-item]').should('have.length.at.least', 1);
    cy.contains('[data-cy=permission-item]', 'finding.read');
    cy.get('[data-cy=home-nav]').within(() => {
      cy.contains('a', 'Missions');
      cy.contains('a', 'Constats');
    });
  });

  it('affiche l\'instantané du contrôle continu', () => {
    cy.visit('/');
    cy.get('[data-cy=home-ccm]').should('exist');
    cy.get('[data-cy=home-kpi-to-triage] strong').should('have.text', '2');
  });

  it('navigue vers la vue transverse des constats', () => {
    cy.visit('/');
    cy.get('[data-cy=home-nav]').contains('a', 'Constats').click();
    cy.location('pathname').should('eq', '/findings');
    cy.get('[data-cy=findings-table]').should('exist');
  });
});
