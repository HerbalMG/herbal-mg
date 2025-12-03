# Category Data Fetching Fix

## Problem
The frontend was not fetching category data from the backend. Categories (called "MainCategory" in backend/admin) were not being displayed from the database.

## Solution

### 1. Created Category Service (`frontend/src/services/categoryService.js`)
- Centralized API calls for category data
- Handles data transformation between backend and frontend formats
- Maps backend fields (`name`, `image_url`) to frontend expectations (`title`, `imageUrl`)

### 2. Updated Components
- **Category.jsx**: Now fetches data from backend via `categoryService`
- **CategoriesPage.jsx**: Uses the new service for consistent data fetching
- Both components maintain fallback data for offline/error scenarios

## Data Flow

```
Backend (main_category table)     →     Frontend
├─ id                             →     id
├─ name                           →     name, title (alias)
├─ slug                           →     slug
├─ image_url                      →     imageUrl, image_url
├─ created_at                     →     created_at
└─ updated_at                     →     updated_at
```

## How to Add Categories with Images

### Option 1: Using Admin Panel
1. Go to Admin Panel → Main Category section
2. Add category name (e.g., "Diabetes", "Hair Care")
3. The system will auto-generate a slug
4. To add images, you need to update the database directly (see Option 2)

### Option 2: Direct Database Update
```sql
-- Update existing category with image
UPDATE main_category 
SET image_url = '/assets/diabetes.svg' 
WHERE slug = 'diabetes';

-- Or insert with image
INSERT INTO main_category (name, slug, image_url) 
VALUES ('Diabetes', 'diabetes', '/assets/diabetes.svg');
```

### Option 3: Enhance Admin Panel (Future)
The admin panel can be enhanced to include image upload functionality:
- Add image upload field in `admin/src/components/MainCategory.jsx`
- Update backend controller to handle image uploads
- Store images in `/backend/uploads/categories/` or use cloud storage

## API Endpoints

- **GET** `/api/category` - Get all categories
- **GET** `/api/category/:id` - Get category by ID or slug
- **POST** `/api/category` - Create category (admin only)
- **PUT** `/api/category/:id` - Update category (admin only)
- **DELETE** `/api/category/:id` - Delete category (admin only)

## Setup Instructions

### 1. Run Database Migration (Add image_url column)
```bash
cd backend
node scripts/run-migration.js migrations/add_image_url_to_main_category.sql
```

### 2. Seed Initial Categories
```bash
node scripts/run-migration.js migrations/seed_main_categories.sql
```

This will populate the database with 10 default health concern categories with their respective image paths.

### 3. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Admin (optional)
cd admin
npm run dev
```

## Testing

1. Visit homepage - categories should load from backend
2. Visit `/categories` page - should show all categories
3. Check browser console for any errors
4. Verify categories display with images
5. Test search functionality on categories page

## Fallback Behavior

If backend is unavailable or returns no data:
- Frontend displays hardcoded fallback categories
- User sees a warning banner with "Try Again" button
- All functionality remains operational with static data

## Notes

- Categories are cached in component state
- Images should be placed in `frontend/public/assets/`
- Backend supports both `/api/category` and `/api/main-category` endpoints
- The `main_category` table has `image_url` column for storing image paths
