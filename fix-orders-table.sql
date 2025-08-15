-- Исправление таблицы orders
-- Этот скрипт нужно выполнить в Supabase SQL Editor

-- 1. Добавляем колонку user_id если её нет
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text;

-- 2. Добавляем колонку marketplace если её нет
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace text DEFAULT 'wildberries';

-- 3. Добавляем колонку marketplace_order_id если её нет
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace_order_id text;

-- 4. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace ON orders(marketplace);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_order_id ON orders(marketplace_order_id);

-- 5. Добавляем constraint для marketplace (если его еще нет)
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

-- 6. Отключаем RLS для таблицы orders (временно, для тестирования)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 7. Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
