-- Создание таблицы продавцов
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  shop_name text,
  phone text,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Создание таблицы магазинов
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  telegram_bot_token text NOT NULL,
  wildberries_token text,
  ozon_client_id text,
  ozon_api_key text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Добавление полей для товаров (если таблица уже существует)
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace_id text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price decimal(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS properties jsonb DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Создание таблицы товаров (если не существует)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  marketplace text,
  marketplace_id text,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) NOT NULL DEFAULT 0,
  old_price decimal(10,2),
  stock integer DEFAULT 0,
  reserved integer DEFAULT 0,
  sku text,
  images text[] DEFAULT '{}',
  category text DEFAULT '',
  brand text DEFAULT '',
  rating decimal(3,2) DEFAULT 0,
  reviews_count integer DEFAULT 0,
  in_stock boolean DEFAULT true,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, marketplace_id)
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_marketplace ON products(marketplace);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Включение Row Level Security
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для продавцов
CREATE POLICY "Продавцы могут видеть только свои данные" 
  ON sellers FOR SELECT 
  USING (auth.uid()::text = id::text);

CREATE POLICY "Продавцы могут обновлять только свои данные" 
  ON sellers FOR UPDATE 
  USING (auth.uid()::text = id::text);

-- Политики безопасности для магазинов
CREATE POLICY "Продавцы могут видеть только свои магазины" 
  ON stores FOR SELECT 
  USING (seller_id = auth.uid());

CREATE POLICY "Продавцы могут создавать магазины" 
  ON stores FOR INSERT 
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Продавцы могут обновлять только свои магазины" 
  ON stores FOR UPDATE 
  USING (seller_id = auth.uid());

CREATE POLICY "Продавцы могут удалять только свои магазины" 
  ON stores FOR DELETE 
  USING (seller_id = auth.uid());

-- Политики безопасности для товаров
CREATE POLICY "Продавцы могут видеть товары своих магазинов" 
  ON products FOR SELECT 
  USING (
    store_id IN (
      SELECT id FROM stores WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Продавцы могут создавать товары в своих магазинах" 
  ON products FOR INSERT 
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Продавцы могут обновлять товары своих магазинов" 
  ON products FOR UPDATE 
  USING (
    store_id IN (
      SELECT id FROM stores WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "Продавцы могут удалять товары своих магазинов" 
  ON products FOR DELETE 
  USING (
    store_id IN (
      SELECT id FROM stores WHERE seller_id = auth.uid()
    )
  );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
