import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { createTestUser } from './helpers.js';

describe('Auth API', () => {
  // --- POST /api/auth/register ---
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'fresh@dojo.test', password: 'password123', username: 'freshuser', name: 'Fresh' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('fresh@dojo.test');
      expect(res.body.user.username).toBe('freshuser');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'dupe@dojo.test', password: 'password123', username: 'dupeuser1' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dupe@dojo.test', password: 'password456', username: 'dupeuser2' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });

    it('should return 409 for duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'first@dojo.test', password: 'password123', username: 'taken' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'second@dojo.test', password: 'password456', username: 'taken' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Username');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123', username: 'validuser' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@dojo.test', password: 'short', username: 'validuser2' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@dojo.test', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid username characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@dojo.test', password: 'password123', username: 'bad user!' });

      expect(res.status).toBe(400);
    });

    it('should allow registration without a name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'noname@dojo.test', password: 'password123', username: 'noname' });

      expect(res.status).toBe(201);
      expect(res.body.user.name).toBeNull();
    });

    it('should store email as lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'Test@DOJO.test', password: 'password123', username: 'lowered' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test@dojo.test');
    });
  });

  // --- POST /api/auth/login ---
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'login@dojo.test', username: 'loginuser', name: 'Login User' });
    });

    it('should login successfully and return 200', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@dojo.test', password: 'testpass123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@dojo.test');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@dojo.test', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@dojo.test', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  // --- GET /api/auth/me ---
  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const result = await createTestUser({ email: 'me@dojo.test', username: 'meuser', name: 'Me' });
      token = result.token;
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('me@dojo.test');
      expect(res.body.user.name).toBe('Me');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });
  });

  // --- PUT /api/auth/me ---
  describe('PUT /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const result = await createTestUser({ email: 'update@dojo.test', username: 'updateuser', name: 'Original' });
      token = result.token;
    });

    it('should update name', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });

    it('should update preferences', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ preferences: { sessionLength: 'short', feedbackStyle: 'minimal' } });

      expect(res.status).toBe(200);
      expect(res.body.user.preferences.sessionLength).toBe('short');
      expect(res.body.user.preferences.feedbackStyle).toBe('minimal');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/auth/me')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });
});
