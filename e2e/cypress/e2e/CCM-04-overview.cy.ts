/**
 * CCM-04 — Vue d'ensemble du cockpit CCM (route `/ccm/overview`, §5). Le serveur agrège dans le périmètre
 * `ccm.read` : indicateurs (à trier / ouvertes / contrôles actifs / échec / dérive), tendance des
 * détections et santé par contrôle. Lecture seule ; points d'entrée vers le flux et la bibliothèque. Mocks MSW.
 */
describe('CCM-04 — Vue d\'ensemble CCM', () => {
  it('affiche les indicateurs agrégés', () => {
    cy.visit('/ccm/overview');
    cy.get('[data-cy=ccm-kpis]').should('be.visible');
    cy.get('[data-cy=kpi-exceptions-to-triage] strong').should('have.text', '2');
    cy.get('[data-cy=kpi-open-exceptions] strong').should('have.text', '3');
    cy.get('[data-cy=kpi-active-controls] strong').should('have.text', '2');
    cy.get('[data-cy=kpi-failing-controls] strong').should('have.text', '0');
  });

  it('affiche la tendance et la santé des contrôles', () => {
    cy.visit('/ccm/overview');
    cy.get('[data-cy=ccm-trend-point]').should('have.length', 3);
    cy.get('[data-cy=ccm-overview-control-row]').should('have.length', 3);
  });

  it('ouvre la fiche d\'un contrôle depuis la santé', () => {
    cy.visit('/ccm/overview');
    cy.get('[data-cy=ccm-overview-control-link]').first().click();
    cy.url().should('include', '/ccm/controls/');
    cy.get('[data-cy=ccm-control-label]').should('be.visible');
  });

  it('navigue vers le flux d\'exceptions et la bibliothèque', () => {
    cy.visit('/ccm/overview');
    cy.get('[data-cy=ccm-controls-link]').click();
    cy.url().should('include', '/ccm/controls');
    cy.visit('/ccm/overview');
    cy.get('[data-cy=ccm-exceptions-link]').click();
    cy.url().should('match', /\/ccm$/);
  });

  it('atteint la vue d\'ensemble depuis le flux d\'exceptions', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-overview-link]').click();
    cy.url().should('include', '/ccm/overview');
  });
});
