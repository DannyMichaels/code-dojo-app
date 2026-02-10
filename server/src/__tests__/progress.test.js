import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createTestUser, createTestUserWithSkill } from './helpers.js';

describe('Progress API', () => {
  let token, skillId;

  beforeEach(async () => {
    const setup = await createTestUserWithSkill('javascript');
    token = setup.token;
    skillId = setup.skillId;
  });

  describe('GET /api/progress', () => {
    it('should return dashboard progress', async () => {
      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.totalSkills).toBe(1);
      expect(res.body.progress.totalSessions).toBeGreaterThanOrEqual(1); // onboarding session
      expect(res.body.progress.skills).toHaveLength(1);
      expect(res.body.progress.skills[0].name).toBe('JavaScript');
      expect(res.body.progress.skills[0].currentBelt).toBe('white');
      expect(res.body.progress.skills[0].avgMastery).toBeDefined();
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/progress');
      expect(res.status).toBe(401);
    });

    it('should show empty for user with no skills', async () => {
      const { token: newToken } = await createTestUser();
      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.totalSkills).toBe(0);
      expect(res.body.progress.skills).toHaveLength(0);
    });
  });

  describe('GET /api/progress/:skillId', () => {
    it('should return detailed skill progress', async () => {
      const res = await request(app)
        .get(`/api/progress/${skillId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress.skill.name).toBe('JavaScript');
      expect(res.body.progress.skill.currentBelt).toBe('white');
      expect(res.body.progress.sessionCount).toBeGreaterThanOrEqual(1);
      expect(res.body.progress.concepts).toBeDefined();
      expect(res.body.progress.beltHistory).toBeDefined();
      expect(res.body.progress.reinforcementQueue).toBeDefined();
    });

    it('should return 404 for non-owned skill', async () => {
      const other = await createTestUserWithSkill('python');

      const res = await request(app)
        .get(`/api/progress/${other.skillId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
