describe('Non-Tech Training', () => {
  let token: string;
  let skillId: string;

  beforeEach(() => {
    cy.fixture('user').then((creds) => {
      cy.request('POST', '/api/auth/login', creds).then((res) => {
        token = res.body.token;

        window.localStorage.setItem('__dojo-auth-token', token);
        window.localStorage.setItem(
          '__dojo-auth-storage',
          JSON.stringify({ state: { token, user: res.body.user }, version: 0 }),
        );

        cy.ensureSkill('cooking', token).then((id) => {
          skillId = id;
        });
      });
    });
  });

  it('shows full-width chat with no code editor for non-tech skills', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');

    // No code editor should be present
    cy.get('.CodePanel').should('not.exist');
    // No music panel either
    cy.get('.MusicPanel').should('not.exist');
  });

  it('chat panel is functional and can send messages', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');

    // Wait for session to initialize
    cy.url({ timeout: 15000 }).should('match', /\/train\/[^/]+\/[^/]+/);

    cy.get('.ChatInput textarea').type("Let's start training");
    cy.get('.ChatInput button[type="submit"]').click();

    // Wait for assistant response
    cy.get('.MessageBubble--assistant', { timeout: 60000 }).should('exist');
  });
});
