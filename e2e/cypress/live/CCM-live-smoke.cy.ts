/** Smoke live : le login direct-grant donne une session applicative (pré-requis des specs CCM-05/06 live). */
describe('LIVE — login helper', () => {
  it('opens the app authenticated', () => {
    cy.loginKeycloak();
    cy.visit('/ccm/exceptions');
    cy.location('pathname').should('include', '/ccm/exceptions');
  });
});
