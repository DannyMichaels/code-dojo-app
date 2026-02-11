declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via API and store the JWT token in localStorage.
       */
      apiLogin(email?: string, password?: string): Chainable<void>;

      /**
       * Ensure a skill exists for the logged-in user.
       * Tries to find an existing skill first; creates one if not found.
       * Returns the skill ID.
       */
      ensureSkill(query: string, token: string): Chainable<string>;
    }
  }
}

Cypress.Commands.add('apiLogin', (email?: string, password?: string) => {
  cy.fixture('user').then((creds) => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: email ?? creds.email,
        password: password ?? creds.password,
      },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const { token, user } = res.body;

      // Set the raw JWT token (used by axios interceptor & SSE fetch)
      window.localStorage.setItem('__dojo-auth-token', token);

      // Set the Zustand persist store so the app recognizes the user as logged in
      window.localStorage.setItem(
        '__dojo-auth-storage',
        JSON.stringify({
          state: { token, user },
          version: 0,
        }),
      );
    });
  });
});

Cypress.Commands.add('ensureSkill', (query: string, token: string) => {
  // Check if user already has this skill
  return cy
    .request({
      url: '/api/user-skills',
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const existing = res.body.skills.find(
        (s: any) =>
          s.skillCatalogId?.slug === query.toLowerCase().replace(/\s+/g, '-') ||
          s.skillCatalogId?.name?.toLowerCase() === query.toLowerCase(),
      );

      if (existing) {
        return existing._id as string;
      }

      // Check catalog for a matching slug
      const slug = query.toLowerCase().replace(/\s+/g, '-');
      return cy
        .request({
          url: `/api/skills/catalog/${slug}`,
          failOnStatusCode: false,
        })
        .then((catalogRes) => {
          const body =
            catalogRes.status === 200
              ? { slug }
              : { query };

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
              if (createRes.status === 409 && createRes.body.skill) {
                return createRes.body.skill._id as string;
              }
              throw new Error(
                `Failed to create skill "${query}": ${createRes.status} ${JSON.stringify(createRes.body)}`,
              );
            });
        });
    });
});

export {};
