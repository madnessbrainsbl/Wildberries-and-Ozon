/*
  # Временная политика для добавления тестовых магазинов
  
  1. New Policies
    - Allow anonymous users to insert stores (ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ!)
  
  2. Purpose
    - Enable test data insertion without authentication
    - ВАЖНО: Удалить эту политику перед деплоем в продакшн!
*/

-- Временная политика для вставки магазинов (УДАЛИТЬ В ПРОДАКШЕНЕ!)
CREATE POLICY "Временная политика для вставки магазинов"
  ON stores
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Также добавим политику для чтения созданных магазинов
CREATE POLICY "Временная политика для чтения магазинов анонимами"
  ON stores
  FOR SELECT
  TO anon
  USING (true);
