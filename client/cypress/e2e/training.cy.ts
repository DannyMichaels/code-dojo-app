describe('Training Session', () => {
  let token: string;
  let skillId: string;

  /**
   * Ensures the test user has at least one skill.
   * Tries to use an existing skill first; if none, creates one.
   */
  function ensureSkill(): Cypress.Chainable<string> {
    return cy
      .request({
        url: '/api/user-skills',
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.body.skills.length > 0) {
          return res.body.skills[0]._id as string;
        }

        // No skills — need to create one.
        // First check if "javascript" exists in the catalog (avoids Anthropic call).
        return cy
          .request({
            url: '/api/skills/catalog/javascript',
            failOnStatusCode: false,
          })
          .then((catalogRes) => {
            const body =
              catalogRes.status === 200
                ? { slug: 'javascript' } // catalog entry exists
                : { query: 'javascript' }; // fallback: let the server normalize + create

            return cy
              .request({
                method: 'POST',
                url: '/api/user-skills',
                headers: { Authorization: `Bearer ${token}` },
                body,
                failOnStatusCode: false,
              })
              .then((createRes) => {
                if (createRes.status === 201) {
                  return createRes.body.skill._id as string;
                }
                // 409 = skill already exists (race condition), use it
                if (createRes.status === 409 && createRes.body.skill) {
                  return createRes.body.skill._id as string;
                }
                throw new Error(
                  `Failed to create test skill: ${createRes.status} ${JSON.stringify(createRes.body)}`,
                );
              });
          });
      });
  }

  beforeEach(() => {
    cy.fixture('user').then((creds) => {
      cy.request('POST', '/api/auth/login', creds).then((res) => {
        token = res.body.token;

        window.localStorage.setItem('__dojo-auth-token', token);
        window.localStorage.setItem(
          '__dojo-auth-storage',
          JSON.stringify({ state: { token, user: res.body.user }, version: 0 }),
        );

        ensureSkill().then((id) => {
          skillId = id;
        });
      });
    });
  });

  it('starts a training session and shows chat', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');
  });

  it('sends a message and receives a streaming response', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');

    // Wait for session to initialize (URL updates with session ID)
    cy.url({ timeout: 15000 }).should('match', /\/train\/[^/]+\/[^/]+/);

    cy.get('.ChatInput textarea').type("Let's start training");
    cy.get('.ChatInput button[type="submit"]').click();

    // Wait for the assistant's response to appear (AI streaming can be slow)
    cy.get('.MessageBubble--assistant', { timeout: 60000 }).should('exist');
  });

  it('creates a new session via API', () => {
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

  it('reactivate endpoint returns 404 for non-completed session', () => {
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
        expect(reactivateRes.status).to.eq(404); // Not completed, can't reactivate
      });
    });
  });
});
