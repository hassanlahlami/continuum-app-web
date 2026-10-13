/**
 * CCM-02 — Détail et triage d'une exception CCM (route `/ccm/exceptions/:id`, §5.3, D34). Le serveur
 * décide : les actions viennent de `availableActions` ; écarter exige une justification (422) ; une
 * exception retenue se convertit en constat candidat. Mocks MSW.
 */
describe('CCM-02 — Triage d\'une exception CCM', () => {
  const NEW_ID = 'ce000000-0000-0000-0000-0000000000e1';
  const RETAINED_ID = 'ce000000-0000-0000-0000-0000000000e2';
  const FORBIDDEN_ID = 'ce000000-0000-0000-0000-000000000403';

  it('ouvre le détail depuis le flux et retient une exception', () => {
    cy.visit('/ccm');
    cy.get('[data-cy=ccm-exc-link]').first().click();
    cy.url().should('include', '/ccm/exceptions/');
    cy.get('[data-cy=ccm-exc-summary]').should('be.visible');
    cy.get('[data-cy=ccm-action-retain]').click();
    cy.get('[data-cy=ccm-exc-status]').should('contain', 'Retenue');
    cy.get('[data-cy=ccm-convert-box]').should('be.visible');
  });

  it('refuse d\'écarter sans justification (422)', () => {
    cy.visit(`/ccm/exceptions/${NEW_ID}`);
    cy.get('[data-cy=ccm-action-dismiss]').click();
    cy.get('[data-cy=ccm-action-error]').should('be.visible');
    cy.get('[data-cy=ccm-exc-status]').should('contain', 'À trier');
  });

  it('écarte avec justification', () => {
    cy.visit(`/ccm/exceptions/${NEW_ID}`);
    cy.get('[data-cy=ccm-justification]').type('Faux positif : opération régularisée.');
    cy.get('[data-cy=ccm-action-dismiss]').click();
    cy.get('[data-cy=ccm-exc-status]').should('contain', 'Écartée');
    cy.get('[data-cy=ccm-exc-justification]').should('contain', 'Faux positif');
  });

  it('convertit une exception retenue en constat candidat', () => {
    cy.visit(`/ccm/exceptions/${RETAINED_ID}`);
    cy.get('[data-cy=ccm-convert]').click();
    cy.get('[data-cy=ccm-converted]').should('be.visible');
  });

  it('affiche le refus de droit renvoyé par le serveur (403)', () => {
    cy.visit(`/ccm/exceptions/${FORBIDDEN_ID}`);
    cy.get('[data-cy=ccm-action-retain]').click();
    cy.get('[data-cy=ccm-action-error]').should('be.visible');
  });
});
