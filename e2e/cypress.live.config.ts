import { defineConfig } from 'cypress';

/**
 * Cypress e2e « live » : dev-server `ng serve --configuration live` sur :4203 (vrai backend + Keycloak
 * de la simulation). Identifiants via CYPRESS_APP_USER / CYPRESS_APP_PASSWORD (jamais en dur).
 * Les specs live vivent dans cypress/live/ et appellent `cy.loginKeycloak()`. `npm run e2e:live`.
 */
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4203',
    specPattern: 'cypress/live/**/*.cy.ts',
    supportFile: 'cypress/support/live.ts',
    fixturesFolder: false,
    video: false,
    setupNodeEvents(on) {
      on('task', { log: (m: string) => { console.log(m); return null; } });
    },
    screenshotOnRunFailure: false,
    env: { KEYCLOAK_ORIGIN: 'http://localhost:8180' },
  },
});
