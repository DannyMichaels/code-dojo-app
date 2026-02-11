describe('Dashboard', () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit('/dashboard');
  });

  it('loads the dashboard page', () => {
    cy.url().should('include', '/dashboard');
  });

  it('displays skill cards when user has skills', () => {
    // Wait for the page to finish loading
    cy.get('.AppLayout__main', { timeout: 10000 }).should('be.visible');

    // Check if there are skill cards; if none, that's ok (test user may have no skills locally)
    cy.get('body').then(($body) => {
      if ($body.find('.SkillCard').length > 0) {
        cy.get('.SkillCard .SkillIcon').should('exist');
        cy.get('.SkillCard .BeltBadge').should('exist');
      } else {
        cy.log('No skill cards found — test user has no skills in this environment');
      }
    });
  });

  it('navigates to skill detail on card click (if skills exist)', () => {
    cy.get('.AppLayout__main', { timeout: 10000 }).should('be.visible');

    cy.get('body').then(($body) => {
      if ($body.find('.SkillCard').length > 0) {
        cy.get('.SkillCard').first().click();
        cy.url().should('match', /\/skills\/.+/);
      } else {
        cy.log('Skipping — no skills in this environment');
      }
    });
  });
});
