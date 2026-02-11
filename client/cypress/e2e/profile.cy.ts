describe('Public Profile', () => {
  let username: string;
  let token: string;

  beforeEach(() => {
    cy.fixture('user').then((creds) => {
      cy.request('POST', '/api/auth/login', creds).then((res) => {
        token = res.body.token;
        username = res.body.user.username;

        window.localStorage.setItem('__dojo-auth-token', token);
        window.localStorage.setItem(
          '__dojo-auth-storage',
          JSON.stringify({ state: { token, user: res.body.user }, version: 0 }),
        );
      });
    });
  });

  it('shows the user profile page', () => {
    cy.visit(`/u/${username}`);
    cy.contains(`@${username}`).should('be.visible');
  });

  it('displays skill icons in skill list (if skills exist)', () => {
    cy.visit(`/u/${username}`);
    cy.get('.PublicProfileScreen', { timeout: 10000 }).should('be.visible');

    cy.get('body').then(($body) => {
      if ($body.find('.PublicProfileScreen__skillCard').length > 0) {
        cy.get('.PublicProfileScreen__skillCard .SkillIcon').should('exist');
      } else {
        cy.log('No public skills — skipping icon check');
      }
    });
  });

  it('expands skill to show concept mastery on click (if skills exist)', () => {
    cy.visit(`/u/${username}`);
    cy.get('.PublicProfileScreen', { timeout: 10000 }).should('be.visible');

    cy.get('body').then(($body) => {
      if ($body.find('.PublicProfileScreen__skillCard').length > 0) {
        cy.get('.PublicProfileScreen__skillCard').first().click();
        // Details panel appears (may be empty if no concepts tracked yet)
        cy.get('.PublicProfileScreen__skillCard--expanded').should('exist');
      } else {
        cy.log('No public skills — skipping expand check');
      }
    });
  });

  it('shows day streak', () => {
    cy.visit(`/u/${username}`);
    cy.contains('day streak').should('be.visible');
  });
});
