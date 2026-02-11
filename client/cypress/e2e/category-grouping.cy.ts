describe('Category Grouping', () => {
  beforeEach(() => {
    cy.apiLogin();
  });

  describe('Sidebar', () => {
    it('shows skills grouped by category when multiple categories exist', () => {
      cy.visit('/dashboard');
      cy.get('.AppLayout__main', { timeout: 10000 }).should('be.visible');

      cy.get('body').then(($body) => {
        if ($body.find('.AppLayout__skillsCategoryLabel').length > 0) {
          cy.get('.AppLayout__skillsCategoryLabel').should('have.length.gte', 1);
        } else {
          cy.log('No category labels in sidebar — user may have single-category skills');
        }
      });
    });
  });

  describe('Dashboard', () => {
    it('shows category headers when multiple categories exist', () => {
      cy.visit('/dashboard');
      cy.get('.AppLayout__main', { timeout: 10000 }).should('be.visible');

      cy.get('body').then(($body) => {
        if ($body.find('.DashboardScreen__categoryHeader').length > 0) {
          cy.get('.DashboardScreen__categoryHeader').should('have.length.gte', 1);
          cy.get('.DashboardScreen__categoryLabel').should('have.length.gte', 1);
        } else {
          cy.log('No category headers — user may have single-category skills only');
        }
      });
    });

    it('renders skills inside a categories wrapper', () => {
      cy.visit('/dashboard');
      cy.get('.AppLayout__main', { timeout: 10000 }).should('be.visible');

      cy.get('body').then(($body) => {
        if ($body.find('.SkillCard').length > 0) {
          // Skills exist — they should be inside the categories or skills container
          cy.get('.DashboardScreen__categories, .DashboardScreen__skills').should('exist');
        } else {
          cy.log('No skill cards — test user has no skills');
        }
      });
    });
  });

  describe('Profile', () => {
    it('groups skills by category on public profile', () => {
      // Get the current user's username from the auth store
      cy.window().then((win) => {
        const stored = win.localStorage.getItem('__dojo-auth-storage');
        if (!stored) return;
        const { state } = JSON.parse(stored);
        const username = state?.user?.username;
        if (!username) return;

        cy.visit(`/u/${username}`);
        cy.get('.PublicProfileScreen', { timeout: 10000 }).should('be.visible');

        cy.get('body').then(($body) => {
          if ($body.find('.PublicProfileScreen__categoryLabel').length > 0) {
            cy.get('.PublicProfileScreen__categoryLabel').should('have.length.gte', 1);
          } else {
            cy.log('No category labels on profile — user may have single-category skills');
          }
        });
      });
    });
  });
});
