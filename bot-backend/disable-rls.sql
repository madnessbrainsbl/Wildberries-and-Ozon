-- Disable RLS on all tables to allow bot access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_accounts DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated and anon roles
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON products TO anon, authenticated;
GRANT ALL ON orders TO anon, authenticated;
GRANT ALL ON order_items TO anon, authenticated;
GRANT ALL ON marketplace_accounts TO anon, authenticated;

-- Make sure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
