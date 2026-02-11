describe('Content Moderation', () => {
  let token: string;

  beforeEach(() => {
    cy.fixture('user').then((creds) => {
      cy.request('POST', '/api/auth/login', creds).then((res) => {
        token = res.body.token;
      });
    });
  });

  it('accepts legitimate skill names via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/user-skills',
      headers: { Authorization: `Bearer ${token}` },
      body: { query: 'cooking' },
      failOnStatusCode: false,
    }).then((res) => {
      // 201 = created, 409 = already exists — both are acceptable
      expect(res.status).to.be.oneOf([201, 409]);
    });
  });

  it('accepts known catalog skills by slug', () => {
    cy.request({
      method: 'POST',
      url: '/api/user-skills',
      headers: { Authorization: `Bearer ${token}` },
      body: { slug: 'javascript' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([201, 409]);
    });
  });

  it('rejects empty skill query', () => {
    cy.request({
      method: 'POST',
      url: '/api/user-skills',
      headers: { Authorization: `Bearer ${token}` },
      body: {},
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});
