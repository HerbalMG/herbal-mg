# Backend Migration Guide

## 🎯 Overview

This guide helps you migrate existing controllers and routes to use the new error handling and response formatting system.

## 📋 Quick Checklist

- [ ] Wrap async functions with `catchAsync`
- [ ] Replace `res.json()` with `ApiResponse` methods
- [ ] Replace `throw new Error()` with `ApiError` methods
- [ ] Add validation schemas
- [ ] Update routes to use validation middleware
- [ ] Remove try-catch blocks (handled by catchAsync)

## 🔄 Step-by-Step Migration

### Step 1: Update Imports

**Before:**
```javascript
const sql = require('../config/supabase');
```

**After:**
```javascript
const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
```

### Step 2: Wrap Functions with catchAsync

**Before:**
```javascript
exports.getAllProducts = async (req, res) => {
  try {
    const products = await sql`SELECT * FROM product`;
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**After:**
```javascript
exports.getAllProducts = catchAsync(async (req, res) => {
  const products = await sql`SELECT * FROM product`;
  ApiResponse.success(res, products, 'Products fetched successfully');
});
```

### Step 3: Replace Error Handling

**Before:**
```javascript
if (!product) {
  return res.status(404).json({ 
    success: false, 
    message: 'Product not found' 
  });
}
```

**After:**
```javascript
if (!product) {
  throw ApiError.notFound('Product not found');
}
```

### Step 4: Replace Success Responses

**Before:**
```javascript
res.json({ success: true, data: product });
res.status(201).json({ success: true, data: newProduct });
```

**After:**
```javascript
ApiResponse.success(res, product);
ApiResponse.created(res, newProduct, 'Product created successfully');
```

### Step 5: Add Validation

Create validation schema:
```javascript
// validations/product.validation.js
const createProduct = {
  body: {
    name: { required: true, type: 'string', minLength: 2 },
    price: { required: true, type: 'number', min: 0 },
  },
};

module.exports = { createProduct };
```

Update route:
```javascript
const validate = require('../middleware/validate');
const productValidation = require('../validations/product.validation');

router.post('/', 
  validate(productValidation.createProduct),
  productController.createProduct
);
```

## 📝 Complete Example

### Before Migration

```javascript
// controllers/productController.js
const sql = require('../config/supabase');

exports.getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    let query = sql`SELECT * FROM product WHERE 1=1`;
    
    if (search) {
      query = sql`${query} AND name ILIKE ${'%' + search + '%'}`;
    }
    
    if (category) {
      query = sql`${query} AND category = ${category}`;
    }
    
    const products = await query;
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [product] = await sql`SELECT * FROM product WHERE id = ${id}`;
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    // Manual validation
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }
    
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be positive'
      });
    }
    
    // Check duplicates
    const [existing] = await sql`SELECT id FROM product WHERE name = ${name}`;
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Product already exists'
      });
    }
    
    const [product] = await sql`
      INSERT INTO product (name, price, description)
      VALUES (${name}, ${price}, ${description})
      RETURNING *
    `;
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};
```

### After Migration

```javascript
// controllers/productController.js
const sql = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

exports.getAllProducts = catchAsync(async (req, res) => {
  const { search, category } = req.query;
  
  let query = sql`SELECT * FROM product WHERE 1=1`;
  
  if (search) {
    query = sql`${query} AND name ILIKE ${'%' + search + '%'}`;
  }
  
  if (category) {
    query = sql`${query} AND category = ${category}`;
  }
  
  const products = await query;
  
  ApiResponse.success(res, products, 'Products fetched successfully');
});

exports.getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const [product] = await sql`SELECT * FROM product WHERE id = ${id}`;
  
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  
  ApiResponse.success(res, product);
});

exports.createProduct = catchAsync(async (req, res) => {
  const { name, price, description } = req.body;
  
  // Validation is handled by middleware
  
  // Check duplicates
  const [existing] = await sql`SELECT id FROM product WHERE name = ${name}`;
  if (existing) {
    throw ApiError.conflict('Product already exists');
  }
  
  const [product] = await sql`
    INSERT INTO product (name, price, description)
    VALUES (${name}, ${price}, ${description})
    RETURNING *
  `;
  
  ApiResponse.created(res, product, 'Product created successfully');
});
```

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
    description: {
      required: false,
      type: 'string',
      maxLength: 5000,
    },
  },
};

module.exports = { createProduct };
```

```javascript
// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const productValidation = require('../validations/product.validation');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', 
  validate(productValidation.createProduct),
  productController.createProduct
);

module.exports = router;
```

## 🎨 Common Patterns

### Pattern 1: Not Found Check
```javascript
// Before
if (!item) {
  return res.status(404).json({ error: 'Not found' });
}

// After
if (!item) {
  throw ApiError.notFound('Item not found');
}
```

### Pattern 2: Validation Error
```javascript
// Before
if (!name) {
  return res.status(400).json({ error: 'Name is required' });
}

// After
// Use validation middleware instead
// Or for custom validation:
if (!name) {
  throw ApiError.badRequest('Name is required');
}
```

### Pattern 3: Duplicate Check
```javascript
// Before
if (existing) {
  return res.status(409).json({ error: 'Already exists' });
}

// After
if (existing) {
  throw ApiError.conflict('Resource already exists');
}
```

### Pattern 4: Authorization
```javascript
// Before
if (!req.user || req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}

// After
if (!req.user || req.user.role !== 'admin') {
  throw ApiError.forbidden('Insufficient permissions');
}
```

### Pattern 5: Pagination
```javascript
// Before
res.json({
  success: true,
  data: items,
  page: 1,
  limit: 10,
  total: 100
});

// After
ApiResponse.paginated(res, items, {
  page: 1,
  limit: 10,
  total: 100
});
```

## ✅ Benefits

1. **Consistency**: All responses follow the same format
2. **Less Code**: No need for try-catch blocks
3. **Better Errors**: Automatic error handling with proper status codes
4. **Validation**: Centralized input validation
5. **Maintainability**: Easier to update and debug
6. **Type Safety**: Clear error types and response formats

## 🚀 Next Steps

1. Start with one controller as a test
2. Migrate routes one by one
3. Add validation schemas
4. Test thoroughly
5. Update documentation
6. Repeat for all controllers

## 📚 Reference

- See `backend/controllers/example.controller.js` for complete examples
- See `backend/BACKEND_STRUCTURE.md` for detailed documentation
- See `backend/validations/` for validation examples
