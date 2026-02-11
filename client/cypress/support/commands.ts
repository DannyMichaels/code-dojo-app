declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via API and store the JWT token in localStorage.
       */
      apiLogin(email?: string, password?: string): Chainable<void>;
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

export {};
