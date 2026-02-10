import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createTestUserWithSkill } from './helpers.js';
import BeltHistory from '../models/BeltHistory.js';
import SkillCatalog from '../models/SkillCatalog.js';
import UserSkill from '../models/UserSkill.js';

describe('Belt History API', () => {
  let token, skillId;

  beforeEach(async () => {
    const setup = await createTestUserWithSkill('javascript');
    token = setup.token;
    skillId = setup.skillId;
  });

  describe('GET /api/belt-history/:userSkillId', () => {
    it('should return belt timeline for own skill', async () => {
      const res = await request(app)
        .get(`/api/belt-history/${skillId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.history).toHaveLength(1); // initial white belt entry
      expect(res.body.history[0].toBelt).toBe('white');
      expect(res.body.history[0].fromBelt).toBeNull();
    });

    it('should return 404 for non-owned skill', async () => {
      const other = await createTestUserWithSkill('python');

      const res = await request(app)
        .get(`/api/belt-history/${other.skillId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should require auth', async () => {
      const res = await request(app).get(`/api/belt-history/${skillId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/belt-history/stats/:slug', () => {
    it('should return aggregate stats', async () => {
      // Find the catalog slug for this skill
      const skill = await UserSkill.findById(skillId).lean();
      const catalog = await SkillCatalog.findById(skill.skillCatalogId).lean();

      const res = await request(app).get(`/api/belt-history/stats/${catalog.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalStudents).toBe(1);
      expect(res.body.stats.recentPromotions).toBeDefined();
      expect(res.body.stats.beltDistribution).toBeDefined();
    });

    it('should return 404 for unknown slug', async () => {
      const res = await request(app).get('/api/belt-history/stats/nonexistent-skill');
      expect(res.status).toBe(404);
    });
  });
});
