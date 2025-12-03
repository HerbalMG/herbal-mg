# Fix: 404 Error on Category Endpoint

## The Problem

Frontend was getting **404 (Not Found)** errors when trying to fetch category data. The issue was in `CategoryPage.jsx`:

```javascript
// ❌ WRONG - This endpoint doesn't exist
fetch(`http://localhost:3001/api/category/slug/${categorySlug}`)
```

The backend doesn't have a `/api/category/slug/:slug` route. It only has:
- `/api/category/:identifier` - where identifier can be either ID or slug

## The Solution

### Fixed CategoryPage.jsx

**Before:**
```javascript
// Try to fetch by ID first
const response = await fetch(`http://localhost:3001/api/category/${categoryId}`);

// Then try to fetch by slug with wrong endpoint
const slugResponse = await fetch(`http://localhost:3001/api/category/slug/${categorySlug}`);
```

**After:**
```javascript
// Backend handles both ID and slug in the same endpoint
const identifier = categoryId || categorySlug;
const data = await categoryService.getCategoryByIdOrSlug(identifier);
```

### Changes Made

1. **Removed incorrect endpoint** - No more `/api/category/slug/...`
2. **Use single endpoint** - `/api/category/:identifier` handles both
3. **Use categoryService** - Centralized API calls
4. **Simplified logic** - One call instead of two

## Backend Routes (for reference)

The backend has these routes in `app.js`:

```javascript
app.use('/api/main-category', mainCategoryRouter);
app.use('/api/category', mainCategoryRouter);      // ✅ This one
app.use('/api/main_category', mainCategoryRouter);
```

All three point to the same `mainCategoryRouter` which handles:
- `GET /api/category` - Get all categories
- `GET /api/category/:identifier` - Get by ID or slug (no /slug/ prefix needed!)
- `POST /api/category` - Create (admin only)
- `PUT /api/category/:identifier` - Update (admin only)
- `DELETE /api/category/:identifier` - Delete (admin only)

## How Backend Handles ID vs Slug

In `backend/controllers/mainCategoryController.js`:

```javascript
async function getMainCategoryByIdOrSlug(req, res) {
  const identifier = req.params.identifier;
  let mainCategory;
  
  if (isNumericId(identifier)) {
    // If it's a number, treat as ID
    [mainCategory] = await sql`SELECT * FROM main_category WHERE id = ${identifier}`;
  } else {
    // Otherwise, treat as slug
    [mainCategory] = await sql`SELECT * FROM main_category WHERE slug = ${identifier}`;
  }
  
  if (!mainCategory) return res.status(404).json({ error: 'Main category not found' });
  res.json(mainCategory);
}
```

So you can call:
- `/api/category/1` - Gets category with ID 1
- `/api/category/diabetes` - Gets category with slug "diabetes"

## Testing

### Test 1: Get all categories
```bash
curl http://localhost:3001/api/category
```

### Test 2: Get by ID
```bash
curl http://localhost:3001/api/category/1
```

### Test 3: Get by slug
```bash
curl http://localhost:3001/api/category/diabetes
```

All should return 200 OK with JSON data.

## Frontend Usage

### Using categoryService (Recommended)

```javascript
import { categoryService } from '../services/categoryService';

// Get all categories
const categories = await categoryService.getAllCategories();

// Get by ID or slug
const category = await categoryService.getCategoryByIdOrSlug('diabetes');
// or
const category = await categoryService.getCategoryByIdOrSlug(1);
```

### Direct fetch (Not recommended)

```javascript
// Get all
const response = await fetch('http://localhost:3001/api/category');
const categories = await response.json();

// Get by slug
const response = await fetch('http://localhost:3001/api/category/diabetes');
const category = await response.json();
```

## Verify the Fix

1. **Restart frontend** (if running):
   ```bash
   cd frontend
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Visit a category page**:
   - Go to homepage
   - Click on any category (e.g., "Diabetes")
   - Should navigate to `/category/diabetes`
   - Should load without 404 errors

3. **Check browser console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Should see no 404 errors
   - Should see successful API calls

4. **Check Network tab**:
   - Open DevTools (F12)
   - Go to Network tab
   - Reload page
   - Look for `category` requests
   - All should be 200 OK

## Summary

✅ **Fixed**: Removed incorrect `/api/category/slug/:slug` endpoint call
✅ **Updated**: Now uses `/api/category/:identifier` (works for both ID and slug)
✅ **Improved**: Uses `categoryService` for consistency
✅ **Result**: No more 404 errors when viewing category pages

The backend was always correct - it was the frontend calling the wrong endpoint!
