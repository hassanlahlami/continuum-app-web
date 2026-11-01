/**
 * CCM-05 — Flux d'exceptions (route `/ccm`, docs/pages/09-ccm.md) : liste, filtres statut / criticité /
 * « affectées à moi », navigation vers le détail, accessibilité (axe) et disposition RTL. Mocks MSW.
 */
describe("CCM-05 — Flux d'exceptions", () => {
  it('liste les exceptions avec montant, unité, criticité et statut', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-row]').should('have.length', 2);
    cy.get('[data-cy=ccm-row]').first().should('contain', 'SEUIL-HORAIRE').and('contain', 'Agence A001').and('contain', 'MAD');
  });

  it('filtre par statut (reflété dans l’URL, filtrage serveur)', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-filter-status]').click();
    cy.contains('mat-option', 'Retenue').click();
    cy.location('search').should('include', 'status=RETAINED');
    cy.get('[data-cy=ccm-row]').should('have.length', 1);
    cy.get('[data-cy=ccm-exc-status]').should('contain', 'Retenue');
  });

  it('filtre par criticité sans résultat', () => {
    cy.visit('/ccm?criticality=LOW');
    cy.get('[data-cy=ccm-empty]').should('be.visible');
  });

  it('ouvre le détail depuis une ligne', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-row]').first().click();
    cy.location('pathname').should('match', /\/ccm\/exceptions\//);
  });

  it('est accessible (axe)', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-row]').should('exist');
    cy.injectAxe();
    cy.checkA11y('main, section', { includedImpacts: ['serious', 'critical'] });
  });

  it('reste lisible en RTL', () => {
    cy.visit('/ccm', { onBeforeLoad: (w) => w.document.documentElement.setAttribute('dir', 'rtl') });
    cy.document().its('documentElement.dir').should('eq', 'rtl');
    cy.get('[data-cy=ccm-exceptions-table]').should('be.visible');
    cy.window().then((w) => expect(w.document.documentElement.scrollWidth).to.be.at.most(w.innerWidth + 1));
  });
});
