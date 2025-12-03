# Backend Structure Documentation

## 📁 Folder Structure

```
backend/
├── config/              # Configuration files (database, external services)
├── constants/           # Application constants and enums
├── controllers/         # Request handlers (business logic)
├── middleware/          # Express middleware (auth, validation, error handling)
├── migrations/          # Database migration scripts
├── model/              # Database models
├── routes/             # API route definitions
├── schema/             # Database schema SQL files
├── services/           # Business logic and external service integrations
├── utils/              # Utility functions and helpers
├── validations/        # Request validation schemas
├── app.js              # Express app configuration
└── server.js           # Server entry point
```

## 🎯 Key Components

### 1. Error Handling

#### ApiError Class (`utils/ApiError.js`)
Custom error class for consistent error handling across the application.

```javascript
const ApiError = require('./utils/ApiError');

// Usage examples:
throw ApiError.badRequest('Invalid input');
throw ApiError.notFound('Product not found');
throw ApiError.unauthorized('Invalid credentials');
throw ApiError.forbidden('Access denied');
throw ApiError.conflict('Resource already exists');
```

#### Error Handler Middleware (`middleware/errorHandler.js`)
Centralized error handling middleware that catches all errors and formats responses.

```javascript
// Automatically handles:
// - Database errors (unique violations, foreign key violations)
// - Validation errors
// - Custom ApiErrors
// - Unexpected errors
```

### 2. Response Formatting

#### ApiResponse Class (`utils/ApiResponse.js`)
Standardized response formatter for consistent API responses.

```javascript
const ApiResponse = require('./utils/ApiResponse');

// Usage examples:
ApiResponse.success(res, data, 'Products fetched successfully');
ApiResponse.created(res, newProduct, 'Product created');
ApiResponse.paginated(res, products, { page: 1, limit: 10, total: 100 });
```

### 3. Async Error Handling

#### asyncHandler / catchAsync (`middleware/asyncHandler.js`, `utils/catchAsync.js`)
Wrapper for async route handlers to automatically catch errors.

```javascript
const asyncHandler = require('./middleware/asyncHandler');
const catchAsync = require('./utils/catchAsync');

// Usage:
router.get('/products', asyncHandler(async (req, res) => {
  const products = await getProducts();
  ApiResponse.success(res, products);
}));

// Or with catchAsync (includes request context):
router.get('/products', catchAsync(async (req, res) => {
  const products = await getProducts();
  ApiResponse.success(res, products);
}));
```

### 4. Validation

#### Validation Middleware (`middleware/validate.js`)
Request validation middleware with schema-based validation.

```javascript
const validate = require('./middleware/validate');
const { createProduct } = require('./validations/product.validation');

// Usage:
router.post('/products', validate(createProduct), asyncHandler(async (req, res) => {
  // req.body is validated
  const product = await createProduct(req.body);
  ApiResponse.created(res, product);
}));
```

#### Validation Schemas (`validations/`)
Define validation rules for different entities.

```javascript
// validations/product.validation.js
const createProduct = {
  body: {
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 255,
    },
    price: {
      required: true,
      type: 'number',
      min: 0,
    },
  },
};
```

## 🔧 Usage Examples

### Example 1: Creating a New Controller

```javascript
// controllers/productController.js
const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

exports.getAllProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  let query = sql`SELECT * FROM product WHERE 1=1`;
  
  if (search) {
    query = sql`${query} AND name ILIKE ${'%' + search + '%'}`;
  }
  
  const products = await query;
  
  if (!products.length) {
    throw ApiError.notFound('No products found');
  }
  
  ApiResponse.success(res, products, 'Products fetched successfully');
});

exports.getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const [product] = await sql`SELECT * FROM product WHERE id = ${id}`;
  
  if (!product) {
    throw ApiError.notFound(`Product with id ${id} not found`);
  }
  
  ApiResponse.success(res, product);
});

exports.createProduct = catchAsync(async (req, res) => {
  const { name, price, description } = req.body;
  
  // Check for duplicates
  const [existing] = await sql`SELECT id FROM product WHERE name = ${name}`;
  if (existing) {
    throw ApiError.conflict('Product with this name already exists');
  }
  
  const [product] = await sql`
    INSERT INTO product (name, price, description)
    VALUES (${name}, ${price}, ${description})
    RETURNING *
  `;
  
  ApiResponse.created(res, product, 'Product created successfully');
});

exports.updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const [product] = await sql`
    UPDATE product 
    SET ${sql(updates, ...Object.keys(updates))}
    WHERE id = ${id}
    RETURNING *
  `;
  
  if (!product) {
    throw ApiError.notFound(`Product with id ${id} not found`);
  }
  
  ApiResponse.success(res, product, 'Product updated successfully');
});

exports.deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const [deleted] = await sql`
    DELETE FROM product WHERE id = ${id} RETURNING id
  `;
  
  if (!deleted) {
    throw ApiError.notFound(`Product with id ${id} not found`);
  }
  
  ApiResponse.success(res, null, 'Product deleted successfully');
});
```

### Example 2: Creating Routes with Validation

```javascript
// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const productValidation = require('../validations/product.validation');
const { requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', 
  validate(productValidation.getProducts),
  productController.getAllProducts
);

router.get('/:id', 
  validate(productValidation.getProduct),
  productController.getProductById
);

// Protected routes (admin only)
router.post('/', 
  requireAdmin,
  validate(productValidation.createProduct),
  productController.createProduct
);

router.put('/:id', 
  requireAdmin,
  validate(productValidation.updateProduct),
  productController.updateProduct
);

router.delete('/:id', 
  requireAdmin,
  validate(productValidation.getProduct),
  productController.deleteProduct
);

module.exports = router;
```

### Example 3: Updated app.js

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');
const httpStatus = require('./constants/httpStatus');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
// ... other routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  next(ApiError.notFound('Route not found'));
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
```

## 📝 Best Practices

### 1. Always use catchAsync or asyncHandler
```javascript
// ✅ Good
router.get('/products', catchAsync(async (req, res) => {
  // Your code
}));

// ❌ Bad
router.get('/products', async (req, res) => {
  try {
    // Your code
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Use ApiError for throwing errors
```javascript
// ✅ Good
if (!product) {
  throw ApiError.notFound('Product not found');
}

// ❌ Bad
if (!product) {
  return res.status(404).json({ error: 'Product not found' });
}
```

### 3. Use ApiResponse for sending responses
```javascript
// ✅ Good
ApiResponse.success(res, products, 'Products fetched');

// ❌ Bad
res.json({ success: true, data: products });
```

### 4. Validate all inputs
```javascript
// ✅ Good
router.post('/products', validate(productValidation.createProduct), controller);

// ❌ Bad
router.post('/products', controller); // No validation
```

### 5. Keep controllers thin
Move business logic to services when it gets complex.

```javascript
// services/productService.js
exports.createProductWithRelations = async (productData) => {
  // Complex business logic here
  return product;
};

// controllers/productController.js
exports.createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProductWithRelations(req.body);
  ApiResponse.created(res, product);
});
```

## 🚀 Migration Guide

To migrate existing controllers to the new structure:

1. Wrap async functions with `catchAsync`
2. Replace `res.json()` with `ApiResponse` methods
3. Replace `throw new Error()` with `ApiError` methods
4. Add validation schemas
5. Update routes to use validation middleware

## 📚 Additional Resources

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API Best Practices](https://restfulapi.net/)
