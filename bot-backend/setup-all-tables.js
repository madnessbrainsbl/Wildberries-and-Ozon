const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreateTables() {
  console.log('Checking and creating Supabase tables...\n');

  try {
    // Check if users table exists
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError?.code === '42P01') {
      console.log('❌ Table "users" does not exist');
      console.log('Please create the users table in Supabase Dashboard with the following structure:');
      console.log(`
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
`);
    } else {
      console.log('✅ Table "users" exists');
    }

    // Check if stores table exists
    const { data: storesTable, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);

    if (storesError?.code === '42P01') {
      console.log('❌ Table "stores" does not exist');
      console.log('Please create the stores table in Supabase Dashboard with the following structure:');
      console.log(`
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  marketplace text NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
  name text NOT NULL,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, marketplace)
);

-- Add RLS policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage all stores" ON stores
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
`);
    } else {
      console.log('✅ Table "stores" exists');
    }

    // Check if products table exists
    const { data: productsTable, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (productsError?.code === '42P01') {
      console.log('❌ Table "products" does not exist');
      console.log('Please create the products table in Supabase Dashboard');
    } else {
      console.log('✅ Table "products" exists');
    }

    // Check if orders table exists
    const { data: ordersTable, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (ordersError?.code === '42P01') {
      console.log('❌ Table "orders" does not exist');
      console.log('Please create the orders table in Supabase Dashboard with the following structure:');
      console.log(`
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  marketplace text NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
  marketplace_order_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_amount numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage all orders" ON orders
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
`);
    } else {
      console.log('✅ Table "orders" exists');
    }

    // Check if order_items table exists
    const { data: orderItemsTable, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    if (orderItemsError?.code === '42P01') {
      console.log('❌ Table "order_items" does not exist');
      console.log('Please create the order_items table in Supabase Dashboard');
    } else {
      console.log('✅ Table "order_items" exists');
    }

    console.log('\n📋 Summary:');
    console.log('If any tables are missing, please create them in your Supabase Dashboard');
    console.log('Go to: https://app.supabase.com/project/kzrafexlalajoirzugdj/editor');

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkAndCreateTables();
