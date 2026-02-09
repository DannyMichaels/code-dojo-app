import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createTestUser, createTestUserWithSkill } from './helpers.js';

let token;
let skillId;

describe('Sessions API', () => {
  beforeEach(async () => {
    const setup = await createTestUserWithSkill('javascript');
    token = setup.token;
    skillId = setup.skillId;
  });

  it('POST should create a session', async () => {
    const res = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    expect(res.status).toBe(201);
    expect(res.body.session.type).toBe('training');
    expect(res.body.session.status).toBe('active');
  });

  it('GET should list sessions', async () => {
    await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    const res = await request(app)
      .get(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // 2 sessions: 1 auto-created onboarding + 1 manually created training
    expect(res.body.sessions).toHaveLength(2);
  });

  it('GET /:sid should get session detail', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'onboarding' });

    const sid = createRes.body.session._id;

    const res = await request(app)
      .get(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.session.type).toBe('onboarding');
    expect(res.body.session.messages).toEqual([]);
  });

  it('should isolate sessions between users', async () => {
    // Create session for user 1
    await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    // User 2
    const { token: token2 } = await createTestUser();

    // User 2 tries to list sessions for user 1's skill — should 404
    const res = await request(app)
      .get(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });

  it('should reject creating sessions for non-owned skill', async () => {
    const { token: token2 } = await createTestUser();

    const res = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ type: 'training' });

    expect(res.status).toBe(404);
  });
});
