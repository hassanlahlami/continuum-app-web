import { defineConfig } from 'cypress';

/**
 * Cypress e2e de la Plateforme Fonctionnelle (D36). Les specs tournent contre le dev-server en
 * mode mock (MSW, sans backend ni Keycloak) : `npm run e2e`. Un fichier par identifiant de page,
 * sélecteurs `data-cy` uniquement.
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: false,
    video: false,
    screenshotOnRunFailure: false,
  },
});
