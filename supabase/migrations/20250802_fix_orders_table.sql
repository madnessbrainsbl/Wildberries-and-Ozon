/*
  # Fix Orders Table Structure
  
  1. Add missing columns
    - Add user_id column to match the code expectations
    - Add marketplace column for multi-marketplace support
    - Add marketplace_order_id to store external order IDs
  
  2. Update constraints
    - Add check constraint for marketplace values
*/

-- Add user_id column (telegram user ID)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text;

-- Add marketplace column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace text DEFAULT 'wildberries';

-- Add marketplace_order_id column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace_order_id text;

-- Add constraint for marketplace values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_marketplace_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_marketplace_check 
    CHECK (marketplace IN ('wildberries', 'ozon'));
  END IF;
END $$;

-- Add index for user_id for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Add index for marketplace
CREATE INDEX IF NOT EXISTS idx_orders_marketplace ON orders(marketplace);

-- Add index for marketplace_order_id
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_order_id ON orders(marketplace_order_id);
