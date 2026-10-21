/**
 * COM-05 — Profil & préférences (§1.2). Identité lue sur `/me` (lecture seule) + préférence de thème
 * (persistée, partagée avec la coquille). Servi par les mocks MSW. Sélecteurs `data-cy` uniquement.
 */
describe('COM-05 — Profil & préférences', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('affiche l’identité de l’utilisateur', () => {
    cy.visit('/profile');
    cy.get('[data-cy=profile-identity]').should('exist');
    cy.get('[data-cy=profile-name]').should('contain', 'Inspecteur Un');
    cy.get('[data-cy=profile-locale]').should('contain', 'Français');
  });

  it('change la préférence de thème (appliquée à <html>)', () => {
    cy.visit('/profile');
    cy.get('[data-cy=profile-theme-dark]').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.get('[data-cy=profile-theme-light]').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');
  });

  it('est accessible depuis le bloc utilisateur de la barre supérieure', () => {
    cy.visit('/');
    cy.get('[data-cy=app-user]').click();
    cy.location('pathname').should('eq', '/profile');
    cy.get('[data-cy=profile-identity]').should('exist');
  });
});
