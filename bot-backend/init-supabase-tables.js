const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQL commands to create tables
const sqlCommands = `
-- Create users table (ONLY if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Create marketplace_accounts table (ONLY if it doesn't exist)
CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
    phone TEXT,
    email TEXT,
    is_authenticated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, marketplace)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_user_id ON marketplace_accounts(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for bot operations)
DROP POLICY IF EXISTS "Allow all operations for anon" ON users;
CREATE POLICY "Allow all operations for anon" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations for anon" ON marketplace_accounts;
CREATE POLICY "Allow all operations for anon" ON marketplace_accounts FOR ALL USING (true);
`;

console.log(`
================================================
       SUPABASE DATABASE INITIALIZATION
================================================

This script will help you create the necessary tables in your Supabase database.

To execute the SQL commands:

1. Go to your Supabase Dashboard: ${supabaseUrl}
2. Navigate to SQL Editor (in the left sidebar)
3. Create a new query
4. Copy and paste the following SQL commands:

================================================
${sqlCommands}
================================================

5. Click "Run" to execute the commands

The script will create:
- users table (for storing Telegram users)
- marketplace_accounts table (for storing linked accounts)
- Necessary indexes and policies

After running the SQL commands, your bot should work properly!
`);
