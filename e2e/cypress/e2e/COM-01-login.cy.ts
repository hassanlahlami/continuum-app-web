/**
 * COM-01 — Connexion (D41, BFF). Mode mock : session en mémoire dans les handlers MSW.
 * Couvre : succès, identifiants faux (même message que compte verrouillé), 429, MFA, ACTION_REQUIRED,
 * mode redirect, 403 csrf rejoué, a11y, RTL.
 */
describe('COM-01 — Connexion', () => {
  beforeEach(() => cy.viewport(1280, 800));

  const fill = (user: string, pass = 'demo') => {
    cy.get('[data-cy=login-username]').clear().type(user);
    cy.get('[data-cy=login-password]').type(pass, { log: false });
    cy.get('[data-cy=login-submit]').click();
  };

  it('connecte et redirige vers returnTo (interne uniquement)', () => {
    cy.visit('/login?returnTo=/tasks');
    cy.get('[data-cy=login-form]').should('be.visible');
    cy.injectAxe();
    cy.checkA11y('[data-cy=login-page]');
    fill('inspecteur');
    cy.location('pathname').should('eq', '/tasks');
  });

  it('ignore un returnTo externe', () => {
    cy.visit('/login?returnTo=//evil.example');
    fill('inspecteur');
    cy.location('pathname').should('eq', '/');
  });

  it('401 : message unique pour identifiants faux et compte verrouillé', () => {
    cy.visit('/login');
    fill('inspecteur', 'mauvais');
    cy.get('[data-cy=login-error]').invoke('text').as('wrong');
    cy.get('[data-cy=login-password]').should('have.value', '');
    fill('locked');
    cy.get('@wrong').then((w) => cy.get('[data-cy=login-error]').should('have.text', w));
    cy.location('pathname').should('eq', '/login');
  });

  it('429 : affiche le délai Retry-After', () => {
    cy.visit('/login');
    fill('ratelimited');
    cy.get('[data-cy=login-error]').should('contain', '30 s');
  });

  it('MFA : défi OTP puis session ouverte ; mauvais code refusé', () => {
    cy.visit('/login');
    fill('mfa');
    cy.get('[data-cy=mfa-form]').should('be.visible');
    cy.get('[data-cy=mfa-code]').type('000000');
    cy.get('[data-cy=mfa-submit]').click();
    cy.get('[data-cy=login-error]').should('contain', 'Code invalide');
    cy.get('[data-cy=mfa-code]').clear().type('123456');
    cy.get('[data-cy=mfa-submit]').click();
    cy.location('pathname').should('eq', '/');
  });

  it('ACTION_REQUIRED : bascule en redirection vers /api/auth/authorize', () => {
    cy.visit('/login');
    cy.intercept('GET', '**/api/auth/authorize*', { statusCode: 200, headers: { 'content-type': 'text/html' }, body: '<html><body>authorize-reached</body></html>' }).as('authorize');
    fill('action');
    cy.wait('@authorize');
  });

  it('403 csrf-invalid : relit le cookie et rejoue une fois', () => {
    cy.visit('/login');
    cy.get('[data-cy=login-form]').should('be.visible');
    cy.clearCookie('XSRF-TOKEN');
    fill('inspecteur');
    cy.location('pathname').should('eq', '/');
  });

  it('mode redirect : un seul bouton, pas de formulaire', () => {
    cy.visit('/login', { onBeforeLoad: (w) => ((w as unknown as { __ctMock: object }).__ctMock = { loginMode: 'redirect' }) });
    cy.get('[data-cy=login-redirect]').should('be.visible');
    cy.get('[data-cy=login-form]').should('not.exist');
  });

  it('affiche le SSO entreprise en mode rest', () => {
    cy.visit('/login');
    cy.get('[data-cy=login-sso-entreprise]').should('contain', 'SSO entreprise');
  });

  it('RTL : la page reste utilisable', () => {
    cy.visit('/login', { onBeforeLoad: (w) => w.document.documentElement.setAttribute('dir', 'rtl') });
    cy.get('[data-cy=login-form]').should('be.visible');
  });
});
