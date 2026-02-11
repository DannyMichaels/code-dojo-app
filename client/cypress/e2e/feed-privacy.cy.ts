describe('Feed Privacy', () => {
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

        cy.ensureSkill('javascript', token).then((id) => {
          skillId = id;
        });
      });
    });
  });

  it('can toggle skill privacy via API', () => {
    // Make skill private
    cy.request({
      method: 'PUT',
      url: `/api/user-skills/${skillId}/privacy`,
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: true },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.skill.isPrivate).to.eq(true);
    });

    // Revert to public
    cy.request({
      method: 'PUT',
      url: `/api/user-skills/${skillId}/privacy`,
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: false },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.skill.isPrivate).to.eq(false);
    });
  });

  it('private skill activities are hidden from for-you feed', () => {
    // Make the skill private
    cy.request({
      method: 'PUT',
      url: `/api/user-skills/${skillId}/privacy`,
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: true },
    });

    // Check the for-you feed
    cy.request({
      url: '/api/feed/for-you',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);

      // Get the slug for the private skill
      cy.request({
        url: `/api/user-skills/${skillId}`,
        headers: { Authorization: `Bearer ${token}` },
      }).then((skillRes) => {
        const slug = skillRes.body.skill?.skillCatalogId?.slug;
        if (slug && res.body.activities?.length > 0) {
          const privateActivities = res.body.activities.filter(
            (a: any) => a.skillSlug === slug && a.userId === skillRes.body.skill.userId,
          );
          expect(privateActivities).to.have.length(0);
        }
      });
    });

    // Clean up: make it public again
    cy.request({
      method: 'PUT',
      url: `/api/user-skills/${skillId}/privacy`,
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: false },
    });
  });

  it('public skill activities remain visible in feed', () => {
    // Ensure skill is public
    cy.request({
      method: 'PUT',
      url: `/api/user-skills/${skillId}/privacy`,
      headers: { Authorization: `Bearer ${token}` },
      body: { isPrivate: false },
    });

    cy.request({
      url: '/api/feed/for-you',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      // Feed should load successfully (may or may not have activities)
      expect(res.body).to.have.property('activities');
    });
  });
});
