-- Create users table
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
CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    marketplace TEXT,
    marketplace_id TEXT,
    image_url TEXT,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create marketplace_accounts table
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

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
    marketplace_order_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_marketplace_accounts_user_id ON marketplace_accounts(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Create RLS policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for anon access (for bot operations)
CREATE POLICY "Allow all operations for anon" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON marketplace_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON order_items FOR ALL USING (true);
CREATE POLICY "Allow all operations for anon" ON products FOR ALL USING (true);

-- Insert some sample products
INSERT INTO products (name, description, price, category, marketplace, in_stock) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone', 99999.00, 'Electronics', 'wildberries', true),
('Samsung Galaxy S24', 'Premium Android phone', 89999.00, 'Electronics', 'wildberries', true),
('Nike Air Max', 'Running shoes', 7999.00, 'Footwear', 'ozon', true),
('Adidas Ultraboost', 'Sports shoes', 8999.00, 'Footwear', 'ozon', true),
('Sony WH-1000XM5', 'Noise cancelling headphones', 29999.00, 'Electronics', 'wildberries', true);
