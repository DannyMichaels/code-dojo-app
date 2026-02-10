import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Activity from '../models/Activity.js';
import Session from '../models/Session.js';
import BeltHistory from '../models/BeltHistory.js';
import { createTestUser, createTestUserWithSkill } from './helpers.js';

describe('Social API', () => {
  let tokenA, userA, tokenB, userB;

  beforeEach(async () => {
    const setupA = await createTestUser();
    tokenA = setupA.token;
    userA = setupA.user;

    const setupB = await createTestUser();
    tokenB = setupB.token;
    userB = setupB.user;
  });

  describe('Follow system', () => {
    it('should follow a user', async () => {
      const res = await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Followed');
    });

    it('should prevent self-follow', async () => {
      const res = await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userA._id });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate follow', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      expect(res.status).toBe(409);
    });

    it('should return 404 for non-existent target user', async () => {
      const res = await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(404);
    });

    it('should unfollow a user', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .delete(`/api/social/follow/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Unfollowed');
    });

    it('should return 404 when unfollowing someone not followed', async () => {
      const res = await request(app)
        .delete(`/api/social/follow/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Followers/following lists', () => {
    it('should return followers list', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .get(`/api/social/followers/${userB._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.followers).toHaveLength(1);
      expect(res.body.followers[0].username).toBe(userA.username);
      expect(res.body.total).toBe(1);
    });

    it('should return following list', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .get(`/api/social/following/${userA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.following).toHaveLength(1);
      expect(res.body.following[0].username).toBe(userB.username);
    });
  });

  describe('Is-following check', () => {
    it('should return true when following', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .get(`/api/social/is-following/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      const res = await request(app)
        .get(`/api/social/is-following/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.isFollowing).toBe(false);
    });
  });

  describe('Follow counts', () => {
    it('should return correct counts', async () => {
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app)
        .get(`/api/social/counts/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.followerCount).toBe(1);
      expect(res.body.followingCount).toBe(0);
    });
  });

  describe('User search', () => {
    it('should find users by username', async () => {
      const res = await request(app)
        .get(`/api/users/search?q=${userB.username.substring(0, 4)}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should return 400 for query shorter than 2 chars', async () => {
      const res = await request(app)
        .get('/api/users/search?q=a')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });

    it('should return empty array for no matches', async () => {
      const res = await request(app)
        .get('/api/users/search?q=zzzznonexistent')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(0);
    });
  });

  describe('Activity', () => {
    it('should create skill_started activity when starting a skill', async () => {
      await request(app)
        .post('/api/user-skills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ query: 'javascript' });

      // Give fire-and-forget a moment
      await new Promise(r => setTimeout(r, 100));

      const activities = await Activity.find({ userId: userA._id, type: 'skill_started' }).lean();
      expect(activities).toHaveLength(1);
      expect(activities[0].data.skillSlug).toBe('javascript');
    });
  });

  describe('Following feed', () => {
    it('should return empty when not following anyone', async () => {
      const res = await request(app)
        .get('/api/feed/following')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.activities).toHaveLength(0);
    });

    it('should return followed user activity', async () => {
      // A follows B
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      // B starts a skill
      await request(app)
        .post('/api/user-skills')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ query: 'python' });

      await new Promise(r => setTimeout(r, 100));

      const res = await request(app)
        .get('/api/feed/following')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.activities.length).toBeGreaterThan(0);
      expect(res.body.activities[0].type).toBe('skill_started');
    });
  });

  describe('For-you feed', () => {
    it('should return global activity excluding self', async () => {
      // B starts a skill
      await request(app)
        .post('/api/user-skills')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ query: 'ruby' });

      await new Promise(r => setTimeout(r, 100));

      const res = await request(app)
        .get('/api/feed/for-you')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.activities.length).toBeGreaterThan(0);
      // Should not contain A's own activities
      for (const a of res.body.activities) {
        expect(a.userId._id).not.toBe(userA._id);
      }
    });
  });

  describe('Avatar upload', () => {
    it('should upload a valid avatar', async () => {
      // Minimal valid base64 JPEG (1x1 pixel)
      const avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const res = await request(app)
        .put('/api/auth/me/avatar')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ avatar });

      expect(res.status).toBe(200);
      expect(res.body.user.avatar).toBe(avatar);
    });

    it('should reject non-image data URIs', async () => {
      const res = await request(app)
        .put('/api/auth/me/avatar')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ avatar: 'data:text/plain;base64,aGVsbG8=' });

      expect(res.status).toBe(400);
    });
  });

  describe('Skill delete cascade', () => {
    it('should delete sessions and belt history along with skill', async () => {
      const setup = await createTestUserWithSkill('javascript');

      // Verify sessions and belt history exist
      const sessionsBeforeCount = await Session.countDocuments({ userId: setup.user._id });
      const beltHistoryBeforeCount = await BeltHistory.countDocuments({ userSkillId: setup.skillId });
      expect(sessionsBeforeCount).toBeGreaterThan(0);
      expect(beltHistoryBeforeCount).toBeGreaterThan(0);

      // Delete the skill
      const res = await request(app)
        .delete(`/api/user-skills/${setup.skillId}`)
        .set('Authorization', `Bearer ${setup.token}`);

      expect(res.status).toBe(200);

      // Verify cascade
      const sessionsAfter = await Session.countDocuments({ skillId: setup.skillId, userId: setup.user._id });
      const beltHistoryAfter = await BeltHistory.countDocuments({ userSkillId: setup.skillId });
      expect(sessionsAfter).toBe(0);
      expect(beltHistoryAfter).toBe(0);
    });
  });

  describe('Enhanced public profile', () => {
    it('should include follower counts and highestBelt', async () => {
      // A follows B
      await request(app)
        .post('/api/social/follow')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ userId: userB._id });

      const res = await request(app).get(`/api/users/${userB.username}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.followerCount).toBe(1);
      expect(res.body.profile.followingCount).toBe(0);
      expect(res.body.profile).toHaveProperty('highestBelt');
      expect(res.body.profile).toHaveProperty('currentStreak');
      expect(res.body.profile).toHaveProperty('totalSessions');
    });
  });
});
