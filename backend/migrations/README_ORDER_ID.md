# Order ID Migration

## Overview
This migration changes the order ID from UUID to a custom VARCHAR format: `ORD-TIMESTAMP-RANDOM`

Example: `ORD-LN8X9K2-4F7G2H`

## Why?
- More readable and user-friendly
- Easier to communicate over phone/email
- Sortable by creation time
- Shorter than UUID

## How to Run

### Option 1: Using the migration script (Recommended)
```bash
cd backend
node run-order-id-migration.js
```

### Option 2: Manual SQL execution
```bash
cd backend
psql -U your_username -d your_database -f migrations/change_order_id_to_varchar.sql
```

## What it does:
1. Drops foreign key constraints on `order_item` and `payment` tables
2. Changes `order.id` from UUID to VARCHAR(50)
3. Changes `order_item.order_id` and `payment.order_id` to VARCHAR(50)
4. Re-adds foreign key constraints

## Important Notes:
- ⚠️ **Backup your database before running this migration**
- This will affect existing orders if any
- Run this migration before creating new orders with the updated code
- The migration is idempotent (safe to run multiple times)

## After Migration:
New orders will automatically get IDs in the format: `ORD-LN8X9K2-4F7G2H`

The format consists of:
- Prefix: `ORD-`
- Timestamp: Base36 encoded timestamp (e.g., `LN8X9K2`)
- Random: 6 random characters (e.g., `4F7G2H`)

## Rollback:
If you need to rollback, you'll need to:
1. Change columns back to UUID
2. Generate UUIDs for existing orders
3. Update foreign keys

This is complex, so ensure you have a backup before migrating!
