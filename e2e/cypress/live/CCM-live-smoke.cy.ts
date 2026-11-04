/** Smoke live : le login direct-grant donne une session applicative (pré-requis des specs CCM-05/06 live). */
describe('LIVE — login helper', () => {
  it('opens the app authenticated', () => {
    cy.loginKeycloak();
    cy.visit('/ccm');
    cy.location('pathname').should('include', '/ccm');
  });
});

describe('LIVE — CCM exceptions renders backend data', () => {
  it('shows the heading and at least one exception row (not the empty state)', () => {
    cy.loginKeycloak();
    cy.intercept('GET', '/api/**/exceptions*').as('exceptions');
    cy.visit('/ccm');
    cy.wait('@exceptions').its('response.statusCode').should('eq', 200);
    cy.contains('h1', 'Exceptions CCM');
    cy.get('[data-cy=ccm-empty]').should('not.exist');
    cy.get('[data-cy=ccm-exceptions-table] [data-cy=ccm-row]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=ccm-row]').first().invoke('text').should('match', /\S/);
  });
});
