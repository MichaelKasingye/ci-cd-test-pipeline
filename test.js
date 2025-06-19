const request = require('supertest');
const app = require('./index'); // Assuming your Express app is exported from index.js

describe('TODO API', () => {
  
  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/todos', () => {
    test('should return all todos', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.statusCode).toBe(200);
      expect(res.body.todos).toBeInstanceOf(Array);
      expect(res.body.total).toBeDefined();
      expect(res.body.offset).toBe(0);
    });

    test('should filter completed todos', async () => {
      const res = await request(app).get('/api/todos?completed=true');
      expect(res.statusCode).toBe(200);
      expect(res.body.todos.every(todo => todo.completed)).toBe(true);
    });

    test('should support pagination', async () => {
      const res = await request(app).get('/api/todos?limit=1&offset=0');
      expect(res.statusCode).toBe(200);
      expect(res.body.todos.length).toBe(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });
  });

  describe('GET /api/todos/:id', () => {
    test('should return a specific todo', async () => {
      const res = await request(app).get('/api/todos/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.title).toBeDefined();
    });

    test('should return 404 for non-existent todo', async () => {
      const res = await request(app).get('/api/todos/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Todo not found');
    });
  });

  describe('POST /api/todos', () => {
    test('should create a new todo', async () => {
      const newTodo = {
        title: 'Test todo',
        completed: false
      };

      const res = await request(app)
        .post('/api/todos')
        .send(newTodo);

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe(newTodo.title);
      expect(res.body.completed).toBe(false);
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    test('should require title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ completed: false });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    test('should reject empty title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: '   ', completed: false });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title is required');
    });

    test('should reject title over 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await request(app)
        .post('/api/todos')
        .send({ title: longTitle });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title must be less than 200 characters');
    });
  });

  describe('PUT /api/todos/:id', () => {
    test('should update a todo', async () => {
      const updateData = {
        title: 'Updated todo',
        completed: true
      };

      const res = await request(app)
        .put('/api/todos/1')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updateData.title);
      expect(res.body.completed).toBe(true);
      expect(res.body.updatedAt).toBeDefined();
    });

    test('should return 404 for non-existent todo', async () => {
      const res = await request(app)
        .put('/api/todos/999')
        .send({ title: 'Updated' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Todo not found');
    });

    test('should reject empty title', async () => {
      const res = await request(app)
        .put('/api/todos/1')
        .send({ title: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Title cannot be empty');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    test('should delete a todo', async () => {
      // First create a todo to delete
      const createRes = await request(app)
        .post('/api/todos')
        .send({ title: 'Todo to delete' });

      const todoId = createRes.body.id;

      const deleteRes = await request(app).delete(`/api/todos/${todoId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.message).toBe('Todo deleted successfully');
      expect(deleteRes.body.todo.id).toBe(todoId);

      // Verify it's actually deleted
      const getRes = await request(app).get(`/api/todos/${todoId}`);
      expect(getRes.statusCode).toBe(404);
    });

    test('should return 404 for non-existent todo', async () => {
      const res = await request(app).delete('/api/todos/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Todo not found');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Route not found');
    });
  });
});