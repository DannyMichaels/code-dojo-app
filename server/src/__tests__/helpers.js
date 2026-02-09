import request from 'supertest';
import app from '../app.js';

let userCounter = 0;

/**
 * Create a test user and return their token + user object.
 * Each call creates a unique user to avoid conflicts.
 */
export async function createTestUser(overrides = {}) {
  userCounter++;
  const defaults = {
    email: `testuser${userCounter}@dojo.test`,
    password: 'testpass123',
    username: `testuser${userCounter}`,
    name: `Test User ${userCounter}`,
  };
  const data = { ...defaults, ...overrides };

  const res = await request(app)
    .post('/api/auth/register')
    .send(data);

  if (res.status !== 201) {
    throw new Error(`Failed to create test user: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, user: res.body.user };
}

/**
 * Create a test user and start a skill for them.
 * Returns { token, user, skillId }.
 */
export async function createTestUserWithSkill(skillQuery = 'javascript') {
  const { token, user } = await createTestUser();

  const skillRes = await request(app)
    .post('/api/user-skills')
    .set('Authorization', `Bearer ${token}`)
    .send({ query: skillQuery });

  if (skillRes.status !== 201) {
    throw new Error(`Failed to create test skill: ${skillRes.status} ${JSON.stringify(skillRes.body)}`);
  }

  return { token, user, skillId: skillRes.body.skill._id };
}
