const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage (replace with database in production)
let todos = [
  { id: 1, title: 'Learn Node.js', completed: false, createdAt: new Date().toISOString() },
  { id: 2, title: 'Build REST API', completed: false, createdAt: new Date().toISOString() }
];
let nextId = 3;

// Routes

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all todos
app.get('/api/todos', (req, res) => {
  const { completed, limit, offset } = req.query;
  
  let filteredTodos = todos;
  
  // Filter by completed status
  if (completed !== undefined) {
    const isCompleted = completed === 'true';
    filteredTodos = todos.filter(todo => todo.completed === isCompleted);
  }
  
  // Pagination
  const startIndex = parseInt(offset) || 0;
  const endIndex = limit ? startIndex + parseInt(limit) : filteredTodos.length;
  
  const paginatedTodos = filteredTodos.slice(startIndex, endIndex);
  
  res.json({
    todos: paginatedTodos,
    total: filteredTodos.length,
    offset: startIndex,
    limit: limit ? parseInt(limit) : filteredTodos.length
  });
});

// Get single todo
app.get('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  res.json(todo);
});

// Create new todo
app.post('/api/todos', (req, res) => {
  const { title, completed = false } = req.body;
  
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  if (title.length > 200) {
    return res.status(400).json({ error: 'Title must be less than 200 characters' });
  }
  
  const newTodo = {
    id: nextId++,
    title: title.trim(),
    completed: Boolean(completed),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Update todo
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, completed } = req.body;
  
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  if (title !== undefined) {
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be less than 200 characters' });
    }
    
    todos[todoIndex].title = title.trim();
  }
  
  if (completed !== undefined) {
    todos[todoIndex].completed = Boolean(completed);
  }
  
  todos[todoIndex].updatedAt = new Date().toISOString();
  
  res.json(todos[todoIndex]);
});

// Delete todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(t => t.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  const deletedTodo = todos.splice(todoIndex, 1)[0];
  res.json({ message: 'Todo deleted successfully', todo: deletedTodo });
});

// Delete all completed todos
app.delete('/api/todos/completed', (req, res) => {
  const completedTodos = todos.filter(t => t.completed);
  todos = todos.filter(t => !t.completed);
  
  res.json({ 
    message: `${completedTodos.length} completed todos deleted`, 
    deletedTodos: completedTodos 
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TODO API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;