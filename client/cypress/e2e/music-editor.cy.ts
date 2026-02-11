describe('Music Editor', () => {
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

        cy.ensureSkill('music theory', token).then((id) => {
          skillId = id;
        });
      });
    });
  });

  it('shows music panel instead of code editor for music skills', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.ChatPanel', { timeout: 15000 }).should('be.visible');

    // Music panel should be present, code panel should not
    cy.get('.MusicPanel').should('exist');
    cy.get('.CodePanel').should('not.exist');
  });

  it('renders a staff with VexFlow SVG', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.MusicPanel', { timeout: 15000 }).should('be.visible');

    // VexFlow renders an SVG inside the staff editor
    cy.get('.MusicStaffEditor svg').should('exist');
  });

  it('note palette is visible with duration options', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.MusicPanel', { timeout: 15000 }).should('be.visible');

    cy.get('.NotePalette').should('exist');
    cy.get('.NotePalette__btn').should('have.length.gte', 5);
  });

  it('has clef, time signature, and key signature selectors', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.MusicPanel', { timeout: 15000 }).should('be.visible');

    // Clef selector
    cy.get('.MusicPanel__select[title="Clef"]').should('exist');
    // Time signature selector
    cy.get('.MusicPanel__select[title="Time Signature"]').should('exist');
    // Key signature selector
    cy.get('.MusicPanel__select[title="Key Signature"]').should('exist');
  });

  it('can click on staff to place a note and submit', () => {
    cy.visit(`/train/${skillId}`);
    cy.get('.MusicPanel', { timeout: 15000 }).should('be.visible');

    // Wait for session to initialize
    cy.url({ timeout: 15000 }).should('match', /\/train\/[^/]+\/[^/]+/);

    // Click on the staff to place a note
    cy.get('.MusicStaffEditor').click(200, 100);

    // Submit button should be enabled now (notes exist)
    cy.get('.MusicPanel__toolbarActions .Button--primary').should('not.be.disabled');
    cy.get('.MusicPanel__toolbarActions .Button--primary').click();

    // Verify a chat message was sent with notation data
    cy.get('.MessageBubble--user', { timeout: 10000 }).should('exist');
    cy.get('.MessageBubble--user').last().should('contain.text', 'notation');
  });
});
