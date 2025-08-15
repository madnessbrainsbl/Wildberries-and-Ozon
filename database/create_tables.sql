-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    marketplace TEXT CHECK (marketplace IN ('wildberries', 'ozon')),
    category TEXT,
    sku TEXT,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marketplace TEXT CHECK (marketplace IN ('wildberries', 'ozon')),
    marketplace_order_id TEXT,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create marketplace_accounts table
CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marketplace TEXT CHECK (marketplace IN ('wildberries', 'ozon')),
    phone TEXT,
    email TEXT,
    is_authenticated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, marketplace)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_user_id ON marketplace_accounts(user_id);

-- Add sample products
INSERT INTO products (name, description, price, marketplace, category, sku, in_stock) VALUES
('iPhone 15 Pro', 'Последняя модель iPhone с титановым корпусом', 129999.00, 'wildberries', 'Электроника', 'wb-iphone15pro', true),
('Samsung Galaxy S24', 'Флагманский смартфон Samsung', 89999.00, 'ozon', 'Электроника', 'oz-galaxys24', true),
('AirPods Pro 2', 'Беспроводные наушники с активным шумоподавлением', 24999.00, 'wildberries', 'Аксессуары', 'wb-airpodspro2', true),
('Xiaomi Mi Band 8', 'Фитнес-браслет с цветным экраном', 3999.00, 'ozon', 'Аксессуары', 'oz-miband8', true),
('MacBook Air M2', 'Ультратонкий ноутбук Apple', 109999.00, 'wildberries', 'Компьютеры', 'wb-macbookairm2', true)
ON CONFLICT DO NOTHING;
