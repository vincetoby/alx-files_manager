import request from 'supertest';
import app from '../app';  // Assuming your Express app is exported from app.js

let token;
let fileId;
const user = {
  email: 'test@example.com',
  password: 'password123'
};

describe('API Endpoints', () => {
  beforeAll(async () => {
    await request(app)
      .post('/users')
      .send(user);

    const res = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from(`${user.email}:${user.password}`).toString('base64')}`);
    
    token = res.body.token;
  });

  afterAll(async () => {
    await request(app)
      .get('/disconnect')
      .set('X-Token', token);
  });

  it('GET /status should return status', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ redis: true, db: true });
  });

  it('GET /stats should return statistics', async () => {
    const res = await request(app).get('/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('files');
  });

  it('POST /users should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'test2@example.com', password: 'password123' });
    expect(res.statusCode).toBe(201);
  });

  it('GET /connect should return a token', async () => {
    const res = await request(app)
      .get('/connect')
      .set('Authorization', `Basic ${Buffer.from(`${user.email}:${user.password}`).toString('base64')}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /disconnect should disconnect the user', async () => {
    const res = await request(app)
      .get('/disconnect')
      .set('X-Token', token);
    expect(res.statusCode).toBe(204);
  });

  it('GET /users/me should return user info', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', user.email);
  });

  it('POST /files should upload a file', async () => {
    const res = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({
        name: 'test.txt',
        type: 'file',
        data: Buffer.from('Hello World').toString('base64')
      });
    expect(res.statusCode).toBe(201);
    fileId = res.body.id;
  });

  it('GET /files/:id should return a file document', async () => {
    const res = await request(app)
      .get(`/files/${fileId}`)
      .set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'test.txt');
  });

  it('GET /files should return all files with pagination', async () => {
    const res = await request(app)
      .get('/files')
      .set('X-Token', token)
      .query({ page: 0 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('PUT /files/:id/publish should publish a file', async () => {
    const res = await request(app)
      .put(`/files/${fileId}/publish`)
      .set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isPublic', true);
  });

  it('PUT /files/:id/unpublish should unpublish a file', async () => {
    const res = await request(app)
      .put(`/files/${fileId}/unpublish`)
      .set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isPublic', false);
  });

  it('GET /files/:id/data should return file content', async () => {
    const res = await request(app)
      .get(`/files/${fileId}/data`)
      .set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello World');
  });
});
