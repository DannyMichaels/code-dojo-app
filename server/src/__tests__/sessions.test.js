import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { streamMessage } from '../services/anthropic.js';
import app from '../app.js';
import Session from '../models/Session.js';
import { createTestUser, createTestUserWithSkill } from './helpers.js';
import { releaseSessionLock } from '../services/sessionLock.js';

// Mock the anthropic module — vi.mock is hoisted before imports
vi.mock('../services/anthropic.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    streamMessage: vi.fn(original.streamMessage),
  };
});

let token;
let skillId;

describe('Sessions API', () => {
  beforeEach(async () => {
    const setup = await createTestUserWithSkill('javascript');
    token = setup.token;
    skillId = setup.skillId;
    // Reset mock between tests — clears mockImplementation but keeps it as a vi.fn
    streamMessage.mockReset();
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

  it('DELETE should soft-delete a session (set status to abandoned)', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    const sid = createRes.body.session._id;

    const res = await request(app)
      .delete(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's marked abandoned in DB
    const session = await Session.findById(sid);
    expect(session.status).toBe('abandoned');
  });

  it('GET should not list abandoned sessions', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    const sid = createRes.body.session._id;

    // Soft-delete it
    await request(app)
      .delete(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Only the auto-created onboarding session should remain (the training one is abandoned)
    expect(res.body.sessions).toHaveLength(1);
    expect(res.body.sessions.every(s => s.status !== 'abandoned')).toBe(true);
  });

  it('DELETE should return 404 for non-owned session', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });

    const sid = createRes.body.session._id;

    const { token: token2 } = await createTestUser();

    const res = await request(app)
      .delete(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });

  it('should persist AI response after tool-use iterations', async () => {
    // Create a session
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });
    const sid = createRes.body.session._id;

    // Mock streamMessage to simulate: iteration 1 returns tool call + text,
    // iteration 2 returns only text (no tools, exits loop)
    let callCount = 0;
    streamMessage.mockImplementation(async ({ onText, onToolUse }) => {
      callCount++;
      if (callCount === 1) {
        // First iteration: text + tool call
        if (onText) onText('Let me analyze your code.');
        const toolCall = {
          id: 'tool_1',
          type: 'tool_use',
          name: 'record_observation',
          input: { type: 'breakthrough', concept: 'test', note: 'Great pattern', severity: 'positive' },
        };
        if (onToolUse) onToolUse(toolCall);
        return {
          text: 'Let me analyze your code.',
          toolCalls: [toolCall],
          response: { content: [{ type: 'text', text: 'Let me analyze your code.' }, toolCall] },
        };
      } else {
        // Second iteration: text only, no tools → exits loop
        if (onText) onText('Great work on this exercise!');
        return {
          text: 'Great work on this exercise!',
          toolCalls: [],
          response: { content: [{ type: 'text', text: 'Great work on this exercise!' }] },
        };
      }
    });

    // Send a message via the SSE endpoint
    await request(app)
      .post(`/api/user-skills/${skillId}/sessions/${sid}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Here is my solution' });

    // Verify the full response from BOTH iterations was persisted
    const updated = await Session.findById(sid);
    const assistantMessages = updated.messages.filter(m => m.role === 'assistant');
    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0].content).toContain('Let me analyze your code.');
    expect(assistantMessages[0].content).toContain('Great work on this exercise!');
  });

  it('should return 409 when session is already processing a message', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });
    const sid = createRes.body.session._id;

    // Mock streamMessage to resolve immediately
    streamMessage.mockImplementation(async ({ onText }) => {
      if (onText) onText('Hello');
      return { text: 'Hello', toolCalls: [], response: { content: [{ type: 'text', text: 'Hello' }] } };
    });

    // Manually acquire the lock to simulate an in-progress message
    const { acquireSessionLock } = await import('../services/sessionLock.js');
    acquireSessionLock(sid);

    try {
      // Request should get 409 because the lock is held
      const res = await request(app)
        .post(`/api/user-skills/${skillId}/sessions/${sid}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Should be rejected' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already processing');
    } finally {
      // Release the lock so it doesn't affect other tests
      releaseSessionLock(sid);
    }
  });

  it('DELETE should return 404 for already-abandoned session', async () => {
    const createRes = await request(app)
      .post(`/api/user-skills/${skillId}/sessions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'training' });
    const sid = createRes.body.session._id;

    // First delete should succeed
    const res1 = await request(app)
      .delete(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res1.status).toBe(200);

    // Second delete should return 404 (already abandoned)
    const res2 = await request(app)
      .delete(`/api/user-skills/${skillId}/sessions/${sid}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(404);
  });
});
