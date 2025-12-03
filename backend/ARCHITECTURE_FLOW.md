# Backend Architecture Flow

## 📊 Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS MIDDLEWARE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │     CORS     │→ │  Body Parser │→ │   Logging    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ROUTE MATCHING                           │
│                    /api/products/:id                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION MIDDLEWARE                         │
│                     validate(schema)                             │
│                                                                  │
│  ✓ Check required fields                                        │
│  ✓ Validate types                                               │
│  ✓ Check patterns                                               │
│  ✓ Custom validations                                           │
│                                                                  │
│  ❌ Invalid → throw ApiError.badRequest()                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION MIDDLEWARE                      │
│                    requireAuth / requireAdmin                    │
│                                                                  │
│  ✓ Check JWT token                                              │
│  ✓ Verify user role                                             │
│                                                                  │
│  ❌ Unauthorized → throw ApiError.unauthorized()                │
│  ❌ Forbidden → throw ApiError.forbidden()                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER (catchAsync)                     │
│                                                                  │
│  exports.getProduct = catchAsync(async (req, res) => {         │
│    const { id } = req.params;                                   │
│                                                                  │
│    // Business Logic                                            │
│    const [product] = await sql`SELECT * FROM product...`;      │
│                                                                  │
│    // Error Handling                                            │
│    if (!product) {                                              │
│      throw ApiError.notFound('Product not found');             │
│    }                                                             │
│                                                                  │
│    // Success Response                                          │
│    ApiResponse.success(res, product);                           │
│  });                                                             │
│                                                                  │
│  ✓ Success → ApiResponse                                        │
│  ❌ Error → throw ApiError                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
         ┌──────────────────┐  ┌──────────────────┐
         │   SUCCESS PATH   │  │    ERROR PATH    │
         └────────┬─────────┘  └────────┬─────────┘
                  │                     │
                  ▼                     ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │   ApiResponse        │  │  errorConverter      │
    │                      │  │                      │
    │  Format response:    │  │  Convert to ApiError │
    │  {                   │  │  if needed           │
    │    statusCode: 200,  │  └──────────┬───────────┘
    │    success: true,    │             │
    │    message: "...",   │             ▼
    │    data: {...}       │  ┌──────────────────────┐
    │  }                   │  │  errorHandler        │
    └────────┬─────────────┘  │                      │
             │                │  Format error:       │
             │                │  {                   │
             │                │    success: false,   │
             │                │    message: "..."    │
             │                │  }                   │
             │                └──────────┬───────────┘
             │                           │
             └───────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │      SEND RESPONSE            │
         │      TO CLIENT                │
         └───────────────────────────────┘
```

## 🔄 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR OCCURS IN CONTROLLER                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Is ApiError?  │
                    └────┬───────┬───┘
                         │       │
                    YES  │       │  NO
                         │       │
                         ▼       ▼
              ┌──────────────┐  ┌──────────────────┐
              │  Use as-is   │  │  errorConverter  │
              │              │  │                  │
              │  ApiError    │  │  Convert to      │
              │  instance    │  │  ApiError        │
              └──────┬───────┘  └────────┬─────────┘
                     │                   │
                     └─────────┬─────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   errorHandler       │
                    │                      │
                    │  1. Check DB errors  │
                    │  2. Format response  │
                    │  3. Log if dev mode  │
                    │  4. Send to client   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Response Format    │
                    │                      │
                    │  {                   │
                    │    success: false,   │
                    │    message: "...",   │
                    │    stack: "..." (dev)│
                    │  }                   │
                    └──────────────────────┘
```

## 🎯 Component Responsibilities

### 1. Routes (`routes/`)
```javascript
// Responsibilities:
// - Define URL patterns
// - Apply middleware
// - Connect to controllers

router.get('/:id', 
  validate(schema),      // Validation
  requireAuth,           // Authentication
  controller.getById     // Controller
);
```

### 2. Validation (`middleware/validate.js`)
```javascript
// Responsibilities:
// - Validate request data
// - Check types, patterns, ranges
// - Throw ApiError if invalid

validate(schema) → ✓ Pass → Next
                 → ✗ Fail → ApiError.badRequest()
```

### 3. Controllers (`controllers/`)
```javascript
// Responsibilities:
// - Handle business logic
// - Query database
// - Throw ApiError on failure
// - Return ApiResponse on success

catchAsync(async (req, res) => {
  // Logic
  if (error) throw ApiError.xxx();
  ApiResponse.success(res, data);
});
```

### 4. Error Handler (`middleware/errorHandler.js`)
```javascript
// Responsibilities:
// - Catch all errors
// - Convert to ApiError
// - Format response
// - Log errors
// - Send to client

errorConverter → errorHandler → Response
```

### 5. Response Formatter (`utils/ApiResponse.js`)
```javascript
// Responsibilities:
// - Format success responses
// - Add metadata
// - Ensure consistency

ApiResponse.success()    → 200
ApiResponse.created()    → 201
ApiResponse.paginated()  → 200 + pagination
```

## 📦 Data Flow Example

### Example: Get Product by ID

```
1. CLIENT
   GET /api/products/123

2. ROUTE
   router.get('/:id', validate(getProduct), controller.getById)

3. VALIDATION
   ✓ Check if :id is numeric
   ✓ Pass to controller

4. CONTROLLER
   const [product] = await sql`SELECT * FROM product WHERE id = ${id}`;
   
   if (!product) {
     throw ApiError.notFound('Product not found');  → Go to ERROR HANDLER
   }
   
   ApiResponse.success(res, product);  → Go to RESPONSE

5. RESPONSE
   {
     statusCode: 200,
     success: true,
     message: "Success",
     data: { id: 123, name: "Product", ... }
   }

6. CLIENT
   Receives formatted response
```

### Example: Create Product (with error)

```
1. CLIENT
   POST /api/products
   { name: "A" }  // Too short

2. ROUTE
   router.post('/', validate(createProduct), controller.create)

3. VALIDATION
   ✗ name.minLength = 2, but got 1
   throw ApiError.badRequest('Validation failed: name must be at least 2 characters')
   → Go to ERROR HANDLER

4. ERROR HANDLER
   errorConverter → Already ApiError
   errorHandler → Format error response

5. RESPONSE
   {
     success: false,
     message: "Validation failed: name must be at least 2 characters"
   }

6. CLIENT
   Receives error response with 400 status
```

## 🔍 Middleware Chain

```
Request
  ↓
CORS
  ↓
Body Parser
  ↓
Route Matching
  ↓
Validation (if defined)
  ↓
Authentication (if defined)
  ↓
Authorization (if defined)
  ↓
Controller (catchAsync)
  ↓
Success → ApiResponse → Client
  ↓
Error → errorConverter → errorHandler → Client
```

## 🎨 File Organization

```
backend/
│
├── config/              # External service configs
│   ├── supabase.js     # Database connection
│   ├── imagekit.js     # Image service
│   └── phonepe.js      # Payment gateway
│
├── constants/           # App constants
│   └── httpStatus.js   # HTTP status codes
│
├── controllers/         # Request handlers
│   ├── productController.js
│   └── example.controller.js
│
├── middleware/          # Express middleware
│   ├── errorHandler.js      # Error handling
│   ├── validate.js          # Validation
│   ├── asyncHandler.js      # Async wrapper
│   └── auth.js              # Authentication
│
├── routes/              # API routes
│   └── productRoutes.js
│
├── services/            # Business logic
│   └── productService.js
│
├── utils/               # Utilities
│   ├── ApiError.js          # Error class
│   ├── ApiResponse.js       # Response formatter
│   └── catchAsync.js        # Async handler
│
├── validations/         # Validation schemas
│   ├── product.validation.js
│   └── auth.validation.js
│
├── app.js               # Express app setup
└── server.js            # Server entry point
```

## 🚀 Quick Decision Tree

```
Need to return data?
  → Use ApiResponse.success()

Need to return error?
  → throw ApiError.xxx()

Need to validate input?
  → Create schema in validations/
  → Use validate(schema) in route

Need async function?
  → Wrap with catchAsync()

Need to query database?
  → Use sql`` in controller

Need complex logic?
  → Move to services/
  → Call from controller
```

---

**This architecture ensures:**
- ✅ Consistent error handling
- ✅ Standardized responses
- ✅ Input validation
- ✅ Clean separation of concerns
- ✅ Easy to maintain and extend
