import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import userRoutes from '../routes/user';
import workspaceRoutes from '../routes/workspace';
import { errorHandler } from '../middleware/errorHandler';
import { users, workspaces, channels } from '../store/memoryStore';

// Set JWT secret for tests
process.env.JWT_SECRET = 'test-secret-for-ci';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use(errorHandler);

let authToken: string;
let userId: string;

beforeEach(() => {
  // Clear in-memory store before each test
  users.length = 0;
  workspaces.length = 0;
  channels.length = 0;
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        username: 'user1',
        email: 'dupe@example.com',
        password: 'password123',
        fullName: 'User One',
      });

      const res = await request(app).post('/api/auth/register').send({
        username: 'user2',
        email: 'dupe@example.com',
        password: 'password123',
        fullName: 'User Two',
      });

      expect(res.status).toBe(409);
    });

    it('rejects short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123',
        fullName: 'Test User',
      });

      expect(res.status).toBe(400);
    });

    it('rejects missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123',
        fullName: 'Login User',
      });
      authToken = res.body.data.token;
      userId = res.body.data.user.id;
    });

    it('logs in with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });
});

describe('Workspace Routes', () => {
  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'wsuser',
      email: 'ws@example.com',
      password: 'password123',
      fullName: 'WS User',
    });
    authToken = res.body.data.token;
  });

  it('creates a workspace with default channels', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'My Workspace' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('My Workspace');

    const channelRes = await request(app)
      .get(`/api/workspaces/${res.body.data.id}/channels`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(channelRes.body.data.length).toBe(2);
    expect(channelRes.body.data.map((c: any) => c.name)).toContain('general');
    expect(channelRes.body.data.map((c: any) => c.name)).toContain('random');
  });

  it('rejects workspace creation without auth', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .send({ name: 'No Auth Workspace' });

    expect(res.status).toBe(401);
  });

  it('creates a custom channel', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test WS' });

    const res = await request(app)
      .post(`/api/workspaces/${wsRes.body.data.id}/channels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'mychannel' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('mychannel');
  });

  it('rejects duplicate channel name', async () => {
    const wsRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test WS' });

    await request(app)
      .post(`/api/workspaces/${wsRes.body.data.id}/channels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'dupechan' });

    const res = await request(app)
      .post(`/api/workspaces/${wsRes.body.data.id}/channels`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'dupechan' });

    expect(res.status).toBe(409);
  });
});

describe('User Routes', () => {
  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'profileuser',
      email: 'profile@example.com',
      password: 'password123',
      fullName: 'Profile User',
    });
    authToken = res.body.data.token;
  });

  it('fetches user profile', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('profile@example.com');
    expect(res.body.data.password).toBeUndefined();
  });

  it('rejects profile fetch without auth', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });
});
