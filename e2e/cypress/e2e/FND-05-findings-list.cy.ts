/**
 * FND-05 — Constats : vue transverse (archétype LISTE, route `/findings`). Tous les constats du
 * périmètre (`GET /findings`, feature `finding.read`). Servi par les mocks MSW.
 */
describe('FND-05 — Constats : vue transverse', () => {
  it('liste les constats du périmètre', () => {
    cy.visit('/findings');
    cy.get('[data-cy=findings-table] [data-cy=finding-row]').should('have.length.at.least', 1);
    cy.contains('[data-cy=finding-row]', 'FND-2026-INSP-014-001');
  });
});
