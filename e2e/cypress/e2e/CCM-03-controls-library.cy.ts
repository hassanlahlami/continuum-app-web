/**
 * CCM-03 — Bibliothèque de contrôles CCM (routes `/ccm/controls` et `/ccm/controls/:id`, §5). Le serveur
 * applique le périmètre ({@code ccm.read}) et renvoie l'état de santé ; le front liste, filtre et ouvre la
 * fiche (lecture seule). Filtres recherche / catégorie / activation servis par le serveur. Mocks MSW.
 */
describe('CCM-03 — Bibliothèque de contrôles', () => {
  const SEUIL_ID = 'cc100000-0000-0000-0000-000000000002';

  it('liste les contrôles et ouvre une fiche', () => {
    cy.visit('/ccm/controls');
    cy.get('[data-cy=ccm-controls-table]').should('be.visible');
    cy.get('[data-cy=ccm-control-row]').should('have.length', 3);
    cy.get('[data-cy=ccm-control-link]').first().click();
    cy.url().should('include', '/ccm/controls/');
    cy.get('[data-cy=ccm-control-label]').should('be.visible');
  });

  it('filtre par catégorie (serveur)', () => {
    cy.visit('/ccm/controls');
    cy.get('[data-cy=ccm-controls-category]').click();
    cy.get('mat-option').contains('Transactions').click();
    cy.get('[data-cy=ccm-control-row]').should('have.length', 1);
    cy.get('[data-cy=ccm-control-row] code').should('contain', 'SEUIL-HORAIRE');
  });

  it('filtre par état désactivé', () => {
    cy.visit('/ccm/controls');
    cy.get('[data-cy=ccm-controls-active]').click();
    cy.get('mat-option').contains('Désactivés').click();
    cy.get('[data-cy=ccm-control-row]').should('have.length', 1);
    cy.get('[data-cy=ccm-control-active]').should('contain', 'Désactivé');
  });

  it('recherche libre par code ou libellé', () => {
    cy.visit('/ccm/controls');
    cy.get('[data-cy=ccm-controls-search]').type('dormants');
    cy.get('[data-cy=ccm-controls-apply]').click();
    cy.get('[data-cy=ccm-control-row]').should('have.length', 1);
    cy.get('[data-cy=ccm-control-row] code').should('contain', 'COMPTES-DORMANTS');
  });

  it('affiche les paramètres métier et la référence normative sur la fiche', () => {
    cy.visit(`/ccm/controls/${SEUIL_ID}`);
    cy.get('[data-cy=ccm-control-label]').should('contain', 'hors seuil');
    cy.get('[data-cy=ccm-control-normative]').should('be.visible');
    cy.get('[data-cy=ccm-param-row]').should('have.length.at.least', 1);
    cy.get('[data-cy=ccm-control-health]').should('contain', 'Conforme');
    cy.get('[data-cy=ccm-control-schedule]').should('contain', 'Planifiée');
  });

  it('navigue entre flux d\'exceptions et bibliothèque', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-controls-link]').click();
    cy.url().should('include', '/ccm/controls');
    cy.get('[data-cy=ccm-exceptions-link]').click();
    cy.url().should('match', /\/ccm$/);
  });
});
