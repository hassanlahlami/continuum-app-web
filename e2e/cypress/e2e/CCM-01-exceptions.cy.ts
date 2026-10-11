/**
 * CCM-01 — Exceptions du contrôle continu (route `/ccm`, §5). Liste les constats générés
 * automatiquement (source CCM) ; le serveur filtre (source=CCM), le front affiche. Mocks MSW.
 */
describe('CCM-01 — Exceptions du contrôle continu', () => {
  it('liste les exceptions générées par le contrôle continu', () => {
    cy.visit('/ccm');
    cy.contains('h1', 'Exceptions CCM');
    cy.get('[data-cy=ccm-exceptions-table] [data-cy=ccm-row]').should('have.length.at.least', 1);
  });
});
