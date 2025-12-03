# 🚀 Migration Instructions

## Quick Start

### Step 1: Run the SQL Migration

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `backend/migrations/RUN_THIS_IN_SUPABASE.sql`
4. Copy the entire content
5. Paste it into the Supabase SQL Editor
6. Click **Run** or press `Ctrl/Cmd + Enter`

### Step 2: Verify Migration

Run these queries in Supabase SQL Editor to verify:

```sql
-- 1. Check users table (should NOT have mobile column)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Check customer table (should have mobile, is_active, last_login)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer' 
ORDER BY ordinal_position;

-- 3. Check customer_session table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_session' 
ORDER BY ordinal_position;

-- 4. Count users by role (should only show admin and limited_admin)
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;

-- 5. Count customers
SELECT COUNT(*) as total_customers FROM customer;
```

### Step 3: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### Step 4: Test Authentication

#### Test Customer OTP Login:

1. Open your frontend application
2. Go to the login page
3. Enter a mobile number (10 digits starting with 6-9)
4. Click "Send OTP"
5. Check your backend console for the OTP (in development mode)
6. Enter the OTP
7. Optionally enter your name
8. Click "Verify & Login"

#### Test Admin Login (if you have admin users):

```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_admin_username", "password": "your_password"}'
```

## 📋 What the Migration Does

1. ✅ Creates `customer_session` table for customer authentication
2. ✅ Updates `customer` table with `is_active` and `last_login` columns
3. ✅ Migrates non-admin users from `users` to `customer` table
4. ✅ Removes `mobile` column from `users` table
5. ✅ Adds constraint to ensure only admin roles in `users` table
6. ✅ Creates indexes for better performance
7. ✅ Cleans up expired sessions

## 🔍 Troubleshooting

### Issue: "column mobile does not exist"

**Cause:** Migration hasn't been run yet

**Solution:** Run the SQL migration in Supabase SQL Editor (Step 1 above)

### Issue: "relation customer_session does not exist"

**Cause:** Migration failed or wasn't completed

**Solution:** 
1. Check Supabase SQL Editor for any error messages
2. Run the migration again
3. Verify the table exists:
   ```sql
   SELECT * FROM customer_session LIMIT 1;
   ```

### Issue: "Invalid or expired token"

**Cause:** Old sessions from before migration

**Solution:** Clear all sessions and login again:
```sql
DELETE FROM customer_session;
DELETE FROM admin_login;
```

Then clear browser localStorage:
```javascript
localStorage.clear();
```

### Issue: Backend won't start

**Cause:** Database connection issue

**Solution:**
1. Check your `.env` file has correct Supabase credentials
2. Verify Supabase project is running
3. Check network connection

## 📊 Before vs After

### Before Migration

```
users table:
├── admin users (username/password)
├── limited_admin users (username/password)
└── customer users (mobile/OTP) ❌ Mixed!

Authentication:
└── admin_login table (for all users)
```

### After Migration

```
users table:
├── admin users (username/password)
└── limited_admin users (username/password)

customer table:
└── customer users (mobile/OTP) ✅ Separated!

Authentication:
├── admin_login table (for admins)
└── customer_session table (for customers) ✅ New!
```

## ✅ Success Indicators

You'll know the migration was successful when:

1. ✅ Backend starts without errors
2. ✅ Customer OTP login works
3. ✅ Admin login still works (if you have admins)
4. ✅ No "column mobile does not exist" errors
5. ✅ Customer profile endpoints work

## 🎯 Next Steps After Migration

1. Test all authentication flows
2. Update any custom queries that reference `users` table
3. Clear old sessions (optional)
4. Monitor logs for any issues
5. Update documentation if needed

## 📞 Need Help?

If you encounter issues:

1. Check the error message carefully
2. Review the troubleshooting section above
3. Verify migration completed successfully
4. Check Supabase logs
5. Review `AUTHENTICATION_MIGRATION.md` for detailed info

---

**Ready to migrate? Follow Step 1 above! 🚀**
