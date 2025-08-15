-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    category TEXT,
    brand TEXT,
    sku TEXT UNIQUE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
    marketplace_id TEXT,
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    images TEXT[],
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
    phone TEXT,
    email TEXT,
    is_authenticated BOOLEAN DEFAULT false,
    cookies JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, marketplace)
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('wildberries', 'ozon')),
    marketplace_order_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert test products for Wildberries
INSERT INTO products (name, description, price, old_price, category, brand, sku, marketplace, marketplace_id, rating, reviews_count, stock, images) VALUES
('iPhone 15 Pro Max 256GB', 'Новый флагман Apple с титановым корпусом', 129990, 139990, 'Электроника', 'Apple', 'WB-IPHONE15PM-256', 'wildberries', '123456789', 4.8, 1250, 15, ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569']),
('Samsung Galaxy S24 Ultra', 'Флагманский смартфон с AI функциями', 119990, 129990, 'Электроника', 'Samsung', 'WB-S24ULTRA-256', 'wildberries', '123456790', 4.7, 890, 22, ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c']),
('AirPods Pro 2', 'Беспроводные наушники с шумоподавлением', 24990, 29990, 'Аксессуары', 'Apple', 'WB-AIRPODS-PRO2', 'wildberries', '123456791', 4.9, 3200, 45, ARRAY['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434']),
('Nike Air Max 270', 'Удобные кроссовки для повседневной носки', 12990, 15990, 'Обувь', 'Nike', 'WB-NIKE-AM270', 'wildberries', '123456792', 4.6, 450, 30, ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff']),
('Xiaomi Mi Band 8', 'Фитнес-браслет с большим экраном', 3990, 4990, 'Гаджеты', 'Xiaomi', 'WB-MIBAND8', 'wildberries', '123456793', 4.5, 2100, 100, ARRAY['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6']);

-- Insert test products for Ozon
INSERT INTO products (name, description, price, old_price, category, brand, sku, marketplace, marketplace_id, rating, reviews_count, stock, images) VALUES
('MacBook Pro 14 M3', 'Профессиональный ноутбук на чипе M3', 189990, 199990, 'Компьютеры', 'Apple', 'OZ-MACBOOK14-M3', 'ozon', '987654321', 4.9, 320, 8, ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8']),
('PlayStation 5 Slim', 'Игровая консоль нового поколения', 54990, 59990, 'Игры', 'Sony', 'OZ-PS5-SLIM', 'ozon', '987654322', 4.8, 1500, 12, ARRAY['https://images.unsplash.com/photo-1606813907291-d86efa9b94db']),
('Dyson V15 Detect', 'Беспроводной пылесос с лазером', 59990, 69990, 'Бытовая техника', 'Dyson', 'OZ-DYSON-V15', 'ozon', '987654323', 4.7, 680, 18, ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64']),
('JBL Flip 6', 'Портативная Bluetooth колонка', 8990, 10990, 'Аудио', 'JBL', 'OZ-JBL-FLIP6', 'ozon', '987654324', 4.6, 1200, 55, ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1']),
('Kindle Paperwhite 5', 'Электронная книга с подсветкой', 13990, 15990, 'Гаджеты', 'Amazon', 'OZ-KINDLE-PW5', 'ozon', '987654325', 4.8, 890, 25, ARRAY['https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae']);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_marketplace ON products(marketplace);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
