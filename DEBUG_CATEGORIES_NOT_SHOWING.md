# Debug Guide: Categories Not Showing

## Quick Diagnosis

### Step 1: Check Backend API
```bash
# Test if backend is running and returning data
curl http://localhost:3001/api/category
```

**Expected**: JSON array with 10 categories
**If fails**: Backend is not running or database is empty

### Step 2: Check Database
```bash
cd backend
npm run test:categories
```

**Expected**: Shows 10 categories with images
**If fails**: Run `npm run seed:categories`

### Step 3: Test in Browser
Open `test-category-api.html` in your browser (double-click the file)

**Expected**: Shows all categories with images
**If fails**: CORS issue or backend not accessible

### Step 4: Check Frontend Console
1. Open your app in browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors

## Common Issues & Solutions

### Issue 1: "Failed to fetch" or CORS Error

**Symptoms:**
- Console shows: `Access to fetch at 'http://localhost:3001/api/category' from origin 'http://localhost:5173' has been blocked by CORS`

**Solution:**
Check backend CORS configuration in `backend/app.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

### Issue 2: Categories Array is Empty

**Symptoms:**
- API returns `[]`
- Console shows: "No categories available from server"

**Solution:**
```bash
cd backend
npm run seed:categories
npm run test:categories
```

### Issue 3: Backend Not Running

**Symptoms:**
- `curl` command fails
- Console shows: "Failed to fetch"

**Solution:**
```bash
cd backend
npm start
# Or for development:
npm run dev
```

### Issue 4: Frontend Not Updated

**Symptoms:**
- Backend works but frontend still shows old data
- New service file not being used

**Solution:**
```bash
cd frontend
# Stop the dev server (Ctrl+C)
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Issue 5: Import Error

**Symptoms:**
- Console shows: "Cannot find module './services/categoryService'"

**Solution:**
Check if file exists:
```bash
ls -la frontend/src/services/categoryService.js
```

If missing, the file wasn't created. Re-create it.

### Issue 6: Environment Variable Issue

**Symptoms:**
- API calls go to wrong URL
- Console shows wrong endpoint

**Solution:**
Check `frontend/.env`:
```bash
cat frontend/.env
```

Should contain:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

If changed, restart frontend dev server.

## Debug Mode

### Enable Detailed Logging

Replace the import in `Category.jsx`:
```javascript
// Change this:
import { categoryService } from "../services/categoryService";

// To this:
import { categoryService } from "../services/categoryService.debug";
```

This will show detailed logs in the console.

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for request to `/api/category`
5. Click on it to see:
   - Request URL
   - Response status
   - Response data

## Manual Test in Console

Open browser console and run:

```javascript
// Test 1: Check if service is imported
console.log('Testing category fetch...');

// Test 2: Fetch directly
fetch('http://localhost:3001/api/category')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Categories:', data);
    console.log('📊 Count:', data.length);
  })
  .catch(err => console.error('❌ Error:', err));

// Test 3: Check environment
console.log('Environment:', import.meta.env);
```

## Verification Checklist

- [ ] Backend is running on port 3001
- [ ] Database has 10 categories (`npm run test:categories`)
- [ ] API returns data (`curl http://localhost:3001/api/category`)
- [ ] CORS is configured correctly
- [ ] Frontend is running on port 5173
- [ ] `.env` file has correct API URL
- [ ] `categoryService.js` file exists
- [ ] No console errors in browser
- [ ] Network tab shows successful API call

## Still Not Working?

### Try Complete Reset

```bash
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Backend
cd backend
npm run seed:categories
npm start

# 3. Frontend (in new terminal)
cd frontend
rm -rf node_modules/.vite
npm run dev

# 4. Open browser
# Visit: http://localhost:5173
# Open DevTools (F12)
# Check Console and Network tabs
```

### Check Component State

Add this to `Category.jsx` temporarily:

```javascript
useEffect(() => {
  console.log('🔍 Categories state:', categories);
  console.log('🔍 Loading state:', loading);
}, [categories, loading]);
```

This will show what data the component has.

## Get Help

If still not working, provide:

1. **Backend test output:**
   ```bash
   npm run test:categories
   ```

2. **API response:**
   ```bash
   curl http://localhost:3001/api/category
   ```

3. **Browser console errors** (screenshot or copy-paste)

4. **Network tab** (screenshot of the API request)

5. **Component state** (from console logs)

This will help identify the exact issue!
