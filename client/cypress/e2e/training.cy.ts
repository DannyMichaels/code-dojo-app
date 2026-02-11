describe('Training Session', () => {
  let token: string;
  let skillId: string | null = null;

  beforeEach(() => {
    cy.fixture('user').then((creds) => {
      cy.request('POST', '/api/auth/login', creds).then((res) => {
        token = res.body.token;

        window.localStorage.setItem('__dojo-auth-token', token);
        window.localStorage.setItem(
          '__dojo-auth-storage',
          JSON.stringify({ state: { token, user: res.body.user }, version: 0 }),
        );

        // Get the first skill to train with (may be empty in local env)
        cy.request({
          url: '/api/user-skills',
          headers: { Authorization: `Bearer ${token}` },
        }).then((skillsRes) => {
          const skills = skillsRes.body.skills;
          skillId = skills.length > 0 ? skills[0]._id : null;
        });
      });
    });
  });

  it('starts a training session and shows chat', function () {
    if (!skillId) return this.skip();
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');
  });

  it('sends a message and receives a streaming response', function () {
    if (!skillId) return this.skip();
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');

    // Wait for session to initialize (URL should update with session ID)
    cy.url({ timeout: 15000 }).should('match', /\/train\/[^/]+\/[^/]+/);

    cy.get('.ChatInput textarea').type("Let's start training");
    cy.get('.ChatInput button[type="submit"]').click();

    // Wait for the assistant's response to appear
    cy.get('.MessageBubble--assistant', { timeout: 60000 }).should('exist');
  });

  it('creates a new session via API', function () {
    if (!skillId) return this.skip();
    cy.request({
      method: 'POST',
      url: `/api/user-skills/${skillId}/sessions`,
      headers: { Authorization: `Bearer ${token}` },
      body: { type: 'training' },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.session).to.have.property('_id');
      expect(res.body.session.status).to.eq('active');
    });
  });

  it('reactivate endpoint returns 404 for non-completed session', function () {
    if (!skillId) return this.skip();
    cy.request({
      method: 'POST',
      url: `/api/user-skills/${skillId}/sessions`,
      headers: { Authorization: `Bearer ${token}` },
      body: { type: 'training' },
    }).then((res) => {
      const sessionId = res.body.session._id;

      cy.request({
        method: 'PATCH',
        url: `/api/user-skills/${skillId}/sessions/${sessionId}/reactivate`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((reactivateRes) => {
        expect(reactivateRes.status).to.eq(404);
      });
    });
  });
});
