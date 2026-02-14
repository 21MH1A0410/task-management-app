// tests/task.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // now exported
const User = require('../models/User');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');

jest.setTimeout(30000);

let authToken;
let userId;

beforeAll(async () => {
  await connectDB();
  await User.deleteMany({});
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('🔐 Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should not register with existing email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Another',
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    authToken = res.body.data.token;
    userId = res.body.data.id;
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrong',
      });
    expect(res.statusCode).toBe(401);
  });

  it('should get current user profile', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should reject access without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('📋 Task CRUD', () => {
  beforeEach(async () => {
    await Task.deleteMany({});
  });

  it('should create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Write tests',
        description: 'Make them pass',
        status: 'pending',
        dueDate: '2025-12-31',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Write tests');
    expect(res.body.data.status).toBe('pending');
  });

  it('should not create task without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'No title' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('should get task by id', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Specific task' });
    const id = create.body.data._id;

    const res = await request(app)
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Specific task');
  });

  it('should return 404 for non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(404);
  });

  it('should update task via PUT (full update)', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Old title', status: 'pending' });
    const id = create.body.data._id;

    const res = await request(app)
      .put(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'New title',
        description: 'Updated',
        status: 'in-progress',
        dueDate: null,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('New title');
    expect(res.body.data.status).toBe('in-progress');
  });

  it('should partially update task via PATCH', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Patch me' });
    const id = create.body.data._id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'completed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.title).toBe('Patch me');
  });

  it('should reject PATCH with empty body', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Empty patch' });
    const id = create.body.data._id;

    const res = await request(app)
      .patch(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Validation failed');
    // Optionally check that details contain the refine message
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'At least one field must be provided for update'
        })
      ])
    );
  });
});

describe('🔍 Queries, Pagination & Filters', () => {
  beforeAll(async () => {
    // Now userId is guaranteed to be set from authentication tests
    await Task.deleteMany({});
    const tasks = [];
    for (let i = 0; i < 15; i++) {
      tasks.push({
        user: userId, // required field
        title: `Task ${i}`,
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in-progress' : 'pending',
      });
    }
    await Task.insertMany(tasks);
  });

  it('should return first page with default limit (10)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.pages).toBe(2);
  });

  it('should return second page', async () => {
    const res = await request(app)
      .get('/api/tasks?page=2&limit=5')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.page).toBe(2);
  });

  it('should filter by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=completed')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    res.body.data.forEach(task => {
      expect(task.status).toBe('completed');
    });
  });

  it('should search by text', async () => {
    const res = await request(app)
      .get('/api/tasks?search=Task 5')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const found = res.body.data.some(task => task.title === 'Task 5');
    expect(found).toBe(true);
  });

  it('should return empty array when page exceeds total pages', async () => {
    const res = await request(app)
      .get('/api/tasks?page=999')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.page).toBe(999);
    expect(res.body.meta.pages).toBe(2);
  });

  it('should reject limit above max (100)', async () => {
    const res = await request(app)
      .get('/api/tasks?limit=200')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(400);
  });
});

describe('🗑️ Soft Delete & Bulk Operations', () => {
  beforeEach(async () => {
    await Task.deleteMany({});
    await Task.insertMany([
      { user: userId, title: 'Pending task', status: 'pending' },
      { user: userId, title: 'In-progress task', status: 'in-progress' },
      { user: userId, title: 'Completed task', status: 'completed' },
    ]);
  });

  it('should soft delete a single task', async () => {
    const task = await Task.findOne({ title: 'Pending task' });
    const id = task._id;

    const res = await request(app)
      .delete(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(id.toString());

    const list = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    const found = list.body.data.find(t => t._id === id.toString());
    expect(found).toBeUndefined();

    const fetch = await request(app)
      .get(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(fetch.statusCode).toBe(404);
  });

  it('should soft delete tasks by status with confirmation', async () => {
    const res = await request(app)
      .delete('/api/tasks?status=pending&confirm=true')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.modifiedCount).toBe(1);

    const list = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    expect(list.body.data).toHaveLength(2);
  });

  it('should reject bulk delete without confirm=true', async () => {
    const res = await request(app)
      .delete('/api/tasks?status=pending')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
  });

  it('should mark all non-completed tasks as completed', async () => {
    const res = await request(app)
      .patch('/api/tasks/complete-all')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.modifiedCount).toBe(2);

    const list = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    list.body.data.forEach(task => {
      expect(task.status).toBe('completed');
    });
  });
});

describe('⚡ Quick Task Flow', () => {
  it('should create a quick task with status in-progress', async () => {
    const res = await request(app)
      .post('/api/tasks/quick')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Quick one' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.status).toBe('in-progress');
    expect(res.body.data.title).toBe('Quick one');
  });
});

describe('🛡️ Validation & Security', () => {
  it('should reject invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Invalid status', status: 'urgent' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject malformed dueDate', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Bad date', dueDate: 'not-a-date' });
    expect(res.statusCode).toBe(400);
  });

  it('should prevent setting user field via PATCH', async () => {
    const create = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Hack attempt' });
    const id = create.body.data._id;

    await request(app)
      .patch(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ user: new mongoose.Types.ObjectId() });

    const task = await Task.findById(id);
    expect(task.user.toString()).toBe(userId.toString());
  });

  it('should reject token for deleted user', async () => {
    const tempUser = await User.create({
      name: 'Temp',
      email: 'temp@test.com',
      password: '123456',
    });
    const tempToken = jwt.sign({ id: tempUser._id }, process.env.JWT_SECRET);
    await User.deleteOne({ _id: tempUser._id });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tempToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error.message).toBe('User not found');
  });

  it('should handle malformed JSON gracefully', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json')
      .send('{"title": "Broken",}'); // trailing comma
    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toBe('Invalid JSON payload');
  });
});