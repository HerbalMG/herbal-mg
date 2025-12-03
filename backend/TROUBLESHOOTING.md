# 🔧 Troubleshooting: "column mobile does not exist" Error

## Problem

Getting error: `PostgresError: column "mobile" does not exist` when trying to verify OTP.

## Root Cause

The error suggests the code is still trying to query the `mobile` column from the `users` table, but the migration removed it.

## Solutions

### Solution 1: Restart the Server Properly

The most common cause is that the server is running cached code.

```bash
# 1. Stop the server completely
# Press Ctrl+C in the terminal running the server
# If that doesn't work, find and kill the process:
lsof -ti:3001 | xargs kill -9

# 2. Clear any Node.js cache
rm -rf node_modules/.cache

# 3. Restart the server
cd backend
npm start
```

### Solution 2: Verify Migration Ran Successfully

Check if the migration actually completed:

```sql
-- Run in Supabase SQL Editor

-- 1. Check if users table still has mobile column (should return 0 rows)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'mobile';

-- 2. Check if customer_session table exists (should return rows)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'customer_session';

-- 3. Check if customer table has required columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'customer' 
AND column_name IN ('mobile', 'is_active', 'last_login');
```

**Expected Results:**
- Query 1: Should return **0 rows** (mobile column removed from users)
- Query 2: Should return **multiple rows** (customer_session table exists)
- Query 3: Should return **3 rows** (mobile, is_active, last_login exist)

### Solution 3: Check for Multiple Server Instances

You might have multiple server instances running:

```bash
# Check what's running on port 3001
lsof -i :3001

# Kill all Node processes
pkill -f node

# Restart the server
cd backend
npm start
```

### Solution 4: Verify File Changes

Make sure the otpAuthController.js file has the correct code:

```bash
# Check if the file queries customer table (not users)
grep -n "FROM customer" backend/controllers/otpAuthController.js

# Should show lines like:
# 88:    FROM customer
```

If this returns nothing, the file wasn't updated correctly.

### Solution 5: Re-run Migration

If the migration didn't complete, run it again:

1. Open Supabase SQL Editor
2. Copy content from `backend/migrations/RUN_THIS_IN_SUPABASE.sql`
3. Run it again (it's safe to run multiple times)
4. Restart the server

### Solution 6: Check Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```bash
# Check if .env exists
ls -la backend/.env

# Verify it has Supabase URL
grep SUPABASE backend/.env
```

## Verification Steps

After trying the solutions above, verify everything works:

### 1. Test Database Connection

```bash
# In backend directory
node -e "const sql = require('./config/supabase'); sql\`SELECT 1\`.then(() => console.log('✅ DB Connected')).catch(e => console.log('❌ Error:', e.message))"
```

### 2. Test Customer Table

```bash
# Run in Supabase SQL Editor
SELECT * FROM customer LIMIT 1;
```

### 3. Test OTP Flow

```bash
# Send OTP
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'

# Check server console for OTP
# Then verify (replace 123456 with actual OTP)
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456", "name": "Test User"}'
```

## Still Not Working?

### Check Server Logs

Look for the exact line causing the error:

```bash
# The error shows:
# at verifyOtp (/path/to/otpAuthController.js:116:37)

# Check what's on line 116:
sed -n '116p' backend/controllers/otpAuthController.js
```

### Manual Code Check

Open `backend/controllers/otpAuthController.js` and verify line ~88 says:

```javascript
const [existingCustomer] = await sql`
  SELECT id, name, email, mobile, is_active
  FROM customer   // ← Should say "customer" not "users"
  WHERE mobile = ${mobile}
`;
```

### Check for Backup Files

Sometimes editors create backup files:

```bash
# Check for backup files
ls -la backend/controllers/otpAuthController.js*

# If you see files like otpAuthController.js.bak, remove them
rm backend/controllers/otpAuthController.js.bak
```

### Force Reload

```bash
# Clear all caches and restart
cd backend
rm -rf node_modules/.cache
pkill -f "node.*server.js"
npm start
```

## Quick Fix Script

Run this to do everything at once:

```bash
#!/bin/bash
echo "🔧 Fixing authentication issue..."

# Kill any running servers
echo "1. Stopping servers..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Clear cache
echo "2. Clearing cache..."
rm -rf backend/node_modules/.cache 2>/dev/null || true

# Wait a moment
sleep 2

# Start server
echo "3. Starting server..."
cd backend && npm start
```

Save this as `fix-auth.sh`, make it executable with `chmod +x fix-auth.sh`, and run it.

## Prevention

To avoid this in the future:

1. Always restart the server after code changes
2. Use nodemon for auto-restart during development
3. Clear cache when switching branches
4. Verify migrations completed before testing

## Need More Help?

If none of these solutions work:

1. Share the output of:
   ```bash
   grep -A 5 -B 5 "FROM" backend/controllers/otpAuthController.js | grep -A 5 -B 5 "mobile"
   ```

2. Share the result of:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
   ```

3. Check if there are multiple versions of the file:
   ```bash
   find . -name "otpAuthController.js" -type f
   ```

---

**Most likely solution: Kill all Node processes and restart the server! 🔄**
