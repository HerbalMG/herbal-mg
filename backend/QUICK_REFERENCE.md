# Quick Reference Card

## 🚀 Common Patterns

### Basic Controller Structure
```javascript
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const sql = require('../config/supabase');

exports.methodName = catchAsync(async (req, res) => {
  // Your logic here
  ApiResponse.success(res, data);
});
```

### Error Handling
```javascript
// Not found
if (!item) throw ApiError.notFound('Item not found');

// Bad request
if (!valid) throw ApiError.badRequest('Invalid input');

// Unauthorized
if (!authenticated) throw ApiError.unauthorized('Login required');

// Forbidden
if (!authorized) throw ApiError.forbidden('Access denied');

// Conflict
if (exists) throw ApiError.conflict('Already exists');
```

### Success Responses
```javascript
// Standard success
ApiResponse.success(res, data, 'Message');

// Created
ApiResponse.created(res, newItem, 'Created successfully');

// Paginated
ApiResponse.paginated(res, items, { page, limit, total });
```

### Validation Schema
```javascript
const schema = {
  body: {
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', pattern: /^.+@.+\..+$/ },
    age: { required: false, type: 'number', min: 0, max: 120 },
    role: { required: true, enum: ['user', 'admin'] },
  },
  params: {
    id: { required: true, type: 'string', pattern: /^\d+$/ },
  },
  query: {
    page: { required: false, type: 'string', pattern: /^\d+$/ },
  },
};
```

### Route with Validation
```javascript
const validate = require('../middleware/validate');
const schema = require('../validations/entity.validation');

router.post('/', validate(schema.create), controller.create);
router.put('/:id', validate(schema.update), controller.update);
```

### Database Queries
```javascript
// Select all
const items = await sql`SELECT * FROM table`;

// Select with condition
const [item] = await sql`SELECT * FROM table WHERE id = ${id}`;

// Insert
const [newItem] = await sql`
  INSERT INTO table (name, value)
  VALUES (${name}, ${value})
  RETURNING *
`;

// Update
const [updated] = await sql`
  UPDATE table 
  SET ${sql(updates, ...Object.keys(updates))}
  WHERE id = ${id}
  RETURNING *
`;

// Delete
const [deleted] = await sql`
  DELETE FROM table WHERE id = ${id} RETURNING id
`;
```

### Pagination
```javascript
const { page = 1, limit = 10 } = req.query;
const offset = (page - 1) * limit;

// Get total count
const [{ total }] = await sql`SELECT COUNT(*) as total FROM table`;

// Get paginated data
const items = await sql`
  SELECT * FROM table 
  LIMIT ${limit} OFFSET ${offset}
`;

ApiResponse.paginated(res, items, {
  page: parseInt(page),
  limit: parseInt(limit),
  total: parseInt(total)
});
```

### Search & Filter
```javascript
let query = sql`SELECT * FROM table WHERE 1=1`;

if (search) {
  const term = `%${search}%`;
  query = sql`${query} AND name ILIKE ${term}`;
}

if (category) {
  query = sql`${query} AND category = ${category}`;
}

const items = await query;
```

## 📋 Validation Rules

| Rule | Type | Example |
|------|------|---------|
| `required` | boolean | `{ required: true }` |
| `type` | string | `{ type: 'string' \| 'number' \| 'boolean' \| 'array' }` |
| `minLength` | number | `{ minLength: 3 }` |
| `maxLength` | number | `{ maxLength: 100 }` |
| `min` | number | `{ min: 0 }` |
| `max` | number | `{ max: 100 }` |
| `pattern` | RegExp | `{ pattern: /^\d+$/ }` |
| `enum` | array | `{ enum: ['a', 'b', 'c'] }` |
| `custom` | function | `{ custom: (val) => val > 0 ? null : 'error' }` |

## 🎨 HTTP Status Codes

| Code | Constant | Usage |
|------|----------|-------|
| 200 | OK | Success |
| 201 | CREATED | Resource created |
| 204 | NO_CONTENT | Success, no data |
| 400 | BAD_REQUEST | Invalid input |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | Not authorized |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate/conflict |
| 422 | UNPROCESSABLE_ENTITY | Validation failed |
| 500 | INTERNAL_SERVER_ERROR | Server error |

## 🔍 Common Mistakes

### ❌ Don't
```javascript
// Don't use try-catch
try {
  const data = await query();
  res.json(data);
} catch (err) {
  res.status(500).json({ error: err.message });
}

// Don't return responses directly
return res.status(404).json({ error: 'Not found' });

// Don't throw generic errors
throw new Error('Something went wrong');
```

### ✅ Do
```javascript
// Use catchAsync
exports.method = catchAsync(async (req, res) => {
  const data = await query();
  ApiResponse.success(res, data);
});

// Throw ApiError
if (!item) throw ApiError.notFound('Item not found');

// Use ApiResponse
ApiResponse.success(res, data, 'Success message');
```

## 📦 Import Cheatsheet

```javascript
// Always needed
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// Database
const sql = require('../config/supabase');

// Validation
const validate = require('../middleware/validate');

// Auth
const { requireAdmin } = require('../middleware/auth');

// HTTP Status (optional)
const httpStatus = require('../constants/httpStatus');
```

## 🎯 Complete Example

```javascript
// Controller
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const sql = require('../config/supabase');

exports.getAll = catchAsync(async (req, res) => {
  const items = await sql`SELECT * FROM items`;
  ApiResponse.success(res, items);
});

exports.getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const [item] = await sql`SELECT * FROM items WHERE id = ${id}`;
  
  if (!item) throw ApiError.notFound('Item not found');
  
  ApiResponse.success(res, item);
});

exports.create = catchAsync(async (req, res) => {
  const { name } = req.body;
  
  const [exists] = await sql`SELECT id FROM items WHERE name = ${name}`;
  if (exists) throw ApiError.conflict('Item already exists');
  
  const [item] = await sql`
    INSERT INTO items (name) VALUES (${name}) RETURNING *
  `;
  
  ApiResponse.created(res, item);
});

// Validation
const createItem = {
  body: {
    name: { required: true, type: 'string', minLength: 2 },
  },
};

// Route
const validate = require('../middleware/validate');
router.post('/', validate(createItem), controller.create);
```

---

**Print this and keep it handy! 📌**
