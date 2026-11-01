/**
 * CCM-06 — Exception : détail, triage et conversion en constat (route `/ccm/exceptions/:id`,
 * docs/pages/09-ccm.md). Nominal, refus 403, conflit 409, accessibilité (axe), RTL. Mocks MSW
 * (sentinelles …000000000403 / …000000000409 renvoyées par le serveur simulé).
 */
describe('CCM-06 — Détail & conversion d’une exception', () => {
  const NEW_ID = 'ce000000-0000-0000-0000-0000000000e1';
  const RETAINED_ID = 'ce000000-0000-0000-0000-0000000000e2';
  const FORBIDDEN_ID = 'ce000000-0000-0000-0000-000000000403';
  const CONFLICT_ID = 'ce000000-0000-0000-0000-000000000409';

  it('nominal : retient une exception et affiche la piste source', () => {
    cy.visit(`/ccm/exceptions/${NEW_ID}`);
    cy.get('[data-cy=ccm-source-record]').should('be.visible');
    cy.get('[data-cy=ccm-action-retain]').click();
    cy.get('[data-cy=ccm-exc-status]').should('contain', 'Retenue');
  });

  it('nominal : convertit une exception retenue en constat', () => {
    cy.visit(`/ccm/exceptions/${RETAINED_ID}`);
    cy.get('[data-cy=ccm-convert]').click();
    cy.get('[data-cy=ccm-converted]').should('be.visible');
  });

  it('403 : affiche le refus de droit du serveur', () => {
    cy.visit(`/ccm/exceptions/${FORBIDDEN_ID}`);
    cy.get('[data-cy=ccm-action-retain]').click();
    cy.get('[data-cy=ccm-action-error]').should('contain', 'non autorisée');
  });

  it('409 : affiche le conflit d’état renvoyé par le serveur', () => {
    cy.visit(`/ccm/exceptions/${CONFLICT_ID}`);
    cy.get('[data-cy=ccm-action-retain]').click();
    cy.get('[data-cy=ccm-action-error]').should('contain', 'statut courant');
  });

  it('est accessible (axe)', () => {
    cy.visit(`/ccm/exceptions/${RETAINED_ID}`);
    cy.get('[data-cy=ccm-convert-box]').should('exist');
    cy.injectAxe();
    cy.checkA11y('main, section', { includedImpacts: ['serious', 'critical'] });
  });

  it('reste lisible en RTL', () => {
    cy.visit(`/ccm/exceptions/${RETAINED_ID}`, { onBeforeLoad: (w) => w.document.documentElement.setAttribute('dir', 'rtl') });
    cy.get('[data-cy=ccm-source-record]').should('be.visible');
    cy.window().then((w) => expect(w.document.documentElement.scrollWidth).to.be.at.most(w.innerWidth + 1));
  });
});
