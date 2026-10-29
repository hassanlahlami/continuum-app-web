/**
 * COM-09 — Mes tâches (archétype LISTE, route `/tasks`). Boîte unifiée servie par les mocks MSW ;
 * actions `claim`/`complete` pilotées par `availableActions`. Sélecteurs `data-cy` uniquement (D36).
 */
describe('COM-09 — Mes tâches', () => {
  it('liste les tâches à traiter, en retard en tête', () => {
    cy.visit('/tasks');
    cy.get('[data-cy=task-row]').should('have.length', 4);
    cy.get('[data-cy=task-row]').first().should('contain', 'Valider le constat').find('[data-cy=task-overdue]');
  });

  it('nomme la colonne d’actions (en-tête masqué visuellement)', () => {
    cy.visit('/tasks');
    cy.get('th.mat-mdc-header-cell').last().should('contain.text', 'Actions');
  });

  it('filtre « en retard » reflété dans l’URL', () => {
    cy.visit('/tasks');
    cy.get('[data-cy=tasks-overdue]').click();
    cy.url().should('include', 'overdueOnly=true');
    cy.get('[data-cy=task-row]').should('have.length', 1);
  });

  it('prend une tâche proposée puis la termine', () => {
    cy.visit('/tasks');
    cy.contains('[data-cy=task-row]', 'Trier').find('[data-cy=task-claim]').click();
    cy.contains('[data-cy=task-row]', 'Trier').should('contain', 'Assignée à moi').find('[data-cy=task-complete]').click();
    cy.get('[data-cy=task-row]').should('have.length', 3);
  });

  it('signale un conflit 409 quand un collègue a pris la tâche', () => {
    cy.visit('/tasks');
    cy.contains('[data-cy=task-row]', 'Instruire').find('[data-cy=task-claim]').click();
    cy.get('[data-cy=tasks-error]').should('contain', 'autre utilisateur');
  });
});
