import 'cypress-axe';
/**
 * LIVE COM-01 — login page against the real BFF. The tenant runs in `redirect` mode, so the in-app form is
 * exercised by forcing `/options` to `rest` while `/login` still hits the real backend.
 * MFA / ACTION_REQUIRED in-app need a real rest-mode tenant + enrolled user: not covered live (see report).
 * Uses unknown usernames only: never locks a real account.
 */
const restMode = () =>
  cy.intercept('GET', '/api/auth/options*', { body: { mode: 'rest', ssoProviders: [], mfaMethods: ['otp'] } });

const logViolations = (v: any[]) =>
  v.forEach((x) => cy.task('log', `${x.id}: ${x.help} -> ${x.nodes.map((n: any) => n.target).join(' | ')}`, { log: false }));

describe('LIVE COM-01 — login page', () => {
  beforeEach(() => cy.viewport(1280, 800));

  it('redirect mode (real options) shows a single redirect button and no password form', () => {
    cy.visit('/login');
    cy.get('[data-cy=login-redirect]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-cy=login-form]').should('not.exist');
    cy.injectAxe();
    cy.checkA11y('[data-cy=login-page]', undefined, logViolations);
  });

  it('redirect button hits /authorize which 302s to Keycloak', () => {
    cy.intercept('GET', '/api/auth/authorize*', (req) => req.reply((res) => res.send()) ).as('authorize');
    cy.visit('/login');
    cy.get('[data-cy=login-redirect]').click();
    cy.wait('@authorize').its('response.headers.location').should('include', '/protocol/openid-connect/auth');
  });

  it('wrong credentials: generic 401 message, password cleared, axe clean', () => {
    restMode();
    cy.visit('/login');
    cy.get('[data-cy=login-username]').type(`ghost-${Date.now()}`);
    cy.get('[data-cy=login-password]').type('wrong', { log: false });
    cy.get('[data-cy=login-submit]').click();
    cy.get('[data-cy=login-error]').should('be.visible').invoke('text').should('match', /\S/);
    cy.get('[data-cy=login-password]').should('have.value', '');
    cy.location('pathname').should('eq', '/login');
    cy.injectAxe();
    cy.checkA11y('[data-cy=login-page]', undefined, logViolations);
  });

  it('repeated failures hit 429 and the UI shows the Retry-After delay', () => {
    restMode();
    cy.intercept('POST', '/api/auth/login').as('login');
    cy.visit('/login');
    const user = `ratelimit-${Date.now()}`;
    for (let i = 0; i < 6; i++) {
      cy.get('[data-cy=login-username]').clear().type(user);
      cy.get('[data-cy=login-password]').type('wrong', { log: false });
      cy.get('[data-cy=login-submit]').click();
      cy.wait('@login').then((x) => { if (i === 5) expect(x.response?.statusCode).to.eq(429); });
    }
    cy.get('[data-cy=login-error]').should('contain', 'Trop de tentatives').and('contain', ' s.');
  });

  it('RTL: page renders with dir=rtl without horizontal overflow', () => {
    restMode();
    cy.visit('/login', { onBeforeLoad: (w) => w.document.documentElement.setAttribute('dir', 'rtl') });
    cy.document().then((d) => d.documentElement.setAttribute('dir', 'rtl'));
    cy.get('[data-cy=login-form]').should('be.visible');
    cy.document().then((d) => expect(d.documentElement.scrollWidth).to.be.at.most(d.documentElement.clientWidth));
    cy.injectAxe();
    cy.checkA11y('[data-cy=login-page]', undefined, logViolations);
  });
});
