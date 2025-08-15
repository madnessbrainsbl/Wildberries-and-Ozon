/*
  # Add public access policies for products in mini-app
  
  1. New Policies
    - Allow anonymous users to read products data
    - Allow anonymous users to read stores data
  
  2. Purpose
    - Enable mini-app to fetch products without authentication
    - Support public catalog viewing
*/

-- Политика для публичного чтения товаров
CREATE POLICY "Публичный доступ к товарам для миниаппа"
  ON products
  FOR SELECT
  TO anon
  USING (true);

-- Политика для публичного чтения магазинов
CREATE POLICY "Публичный доступ к магазинам для миниаппа"
  ON stores
  FOR SELECT
  TO anon
  USING (true);

-- Временная политика для добавления тестовых данных (удалить в продакшене)
CREATE POLICY "Временная политика для вставки товаров"
  ON products
  FOR INSERT
  TO anon
  USING (true)
  WITH CHECK (true);
