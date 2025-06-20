// server.js - Starter Express server for Week 2 assignment

// Import required modules
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware setup
app.use(bodyParser.json());

// Authentication middleware
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
});

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Validation Middleware
function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || price == null || !category || inStock == null) {
    return next(new ValidationError('Missing required product fields'));
  }
  next();
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// TODO: Implement the following routes:
// GET /api/products - Get all products
app.get('/api/products', (req, res) => {
  let result = [...products];

  // Filtering by category
  if (req.query.category) {
    result = result.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
  }

  // Search by name
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(search));
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedResult = result.slice(start, end);

  res.json({
    total: result.length,
    page,
    limit,
    products: paginatedResult
  });
});
// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  try {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST /api/products - Create a new product
app.post('/api/products', validateProduct, (req, res, next) => {
  try {
    const { name, description, price, category, inStock } = req.body;
    const newProduct = {
      id: uuidv4(),
      name,
      description,
      price,
      category,
      inStock
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});
// PUT /api/products/:id - Update a product
app.put('/api/products/:id', validateProduct, (req, res, next) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      throw new NotFoundError('Product not found');
    }
    const updatedProduct = {
      ...products[index],
      ...req.body,
      id: products[index].id
    };
    products[index] = updatedProduct;
    res.json(updatedProduct);
  } catch (err) {
    next(err);
  }
});
// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res, next) => {
  try {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      throw new NotFoundError('Product not found');
    }
    products.splice(index, 1);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});
// GET /api/products/stats - Product statistics (count by category)
app.get('/api/products/stats', (req, res) => {
  const stats = {};
  products.forEach(p => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });
  res.json({ totalProducts: products.length, categories: stats });
});
// TODO: Implement custom middleware for:
// - Request logging
// - Authentication
// - Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.statusCode) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 