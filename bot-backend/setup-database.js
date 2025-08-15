import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

// Note: To execute SQL directly, you need to use Supabase Dashboard or CLI
// This script will check if tables exist and provide instructions

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  console.log('\n📊 Checking database tables...\n');
  
  // Check users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersError) {
    console.log('❌ Table "users" does not exist');
    console.log('   Error:', usersError.message);
  } else {
    console.log('✅ Table "users" exists');
  }
  
  // Check products table
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (productsError) {
    console.log('❌ Table "products" does not exist');
    console.log('   Error:', productsError.message);
  } else {
    console.log('✅ Table "products" exists');
  }
  
  // Check marketplace_accounts table
  const { data: accounts, error: accountsError } = await supabase
    .from('marketplace_accounts')
    .select('*')
    .limit(1);
  
  if (accountsError) {
    console.log('❌ Table "marketplace_accounts" does not exist');
    console.log('   Error:', accountsError.message);
  } else {
    console.log('✅ Table "marketplace_accounts" exists');
  }
  
  // Check orders table
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  
  if (ordersError) {
    console.log('❌ Table "orders" does not exist');
    console.log('   Error:', ordersError.message);
  } else {
    console.log('✅ Table "orders" exists');
  }
  
  // Check order_items table
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('*')
    .limit(1);
  
  if (orderItemsError) {
    console.log('❌ Table "order_items" does not exist');
    console.log('   Error:', orderItemsError.message);
  } else {
    console.log('✅ Table "order_items" exists');
  }
  
  console.log('\n📋 Instructions to create missing tables:');
  console.log('1. Go to your Supabase Dashboard: ' + supabaseUrl);
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of create-tables.sql');
  console.log('4. Execute the SQL commands');
  console.log('\nSQL file location: ' + path.join(__dirname, 'create-tables.sql'));
}

checkDatabase().catch(console.error);
