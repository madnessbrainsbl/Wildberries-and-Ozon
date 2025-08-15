import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestData() {
  try {
    console.log('Adding test data to Supabase...');

    // Создаем тестовый магазин
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: 'Тестовый магазин',
        description: 'Магазин для тестирования функционала',
        telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN,
        wildberries_token: 'test_token',
        owner_id: 'test_user_id', // Замените на реальный ID пользователя
        status: 'active'
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error creating store:', storeError);
      return;
    }

    console.log('Store created:', store.id);

    // Создаем тестовые товары
    const testProducts = [
      {
        store_id: store.id,
        wb_id: '100001',
        name: 'Смартфон Samsung Galaxy A54',
        description: 'Мощный смартфон с отличной камерой и долгим временем работы от батареи',
        price: 29990,
        old_price: 35990,
        images: ['https://via.placeholder.com/300x300?text=Samsung+A54'],
        category: 'Электроника',
        brand: 'Samsung',
        rating: 4.5,
        reviews_count: 234,
        in_stock: true,
        stock: 15,
        sku: 'SMSG-A54-128',
        marketplace: 'wildberries'
      },
      {
        store_id: store.id,
        wb_id: '100002',
        name: 'Наушники Apple AirPods Pro 2',
        description: 'Беспроводные наушники с активным шумоподавлением',
        price: 21990,
        old_price: 24990,
        images: ['https://via.placeholder.com/300x300?text=AirPods+Pro'],
        category: 'Электроника',
        brand: 'Apple',
        rating: 4.8,
        reviews_count: 567,
        in_stock: true,
        stock: 8,
        sku: 'APL-AIRPODS-PRO2',
        marketplace: 'wildberries'
      },
      {
        store_id: store.id,
        wb_id: '100003',
        name: 'Кроссовки Nike Air Max 270',
        description: 'Удобные кроссовки для спорта и повседневной носки',
        price: 8990,
        old_price: 12990,
        images: ['https://via.placeholder.com/300x300?text=Nike+Air+Max'],
        category: 'Обувь',
        brand: 'Nike',
        rating: 4.6,
        reviews_count: 125,
        in_stock: true,
        stock: 25,
        sku: 'NIKE-AM270-42',
        marketplace: 'wildberries'
      },
      {
        store_id: store.id,
        wb_id: '100004',
        name: 'Рюкзак Xiaomi Mi Casual Daypack',
        description: 'Стильный и вместительный рюкзак для города',
        price: 1990,
        old_price: 2490,
        images: ['https://via.placeholder.com/300x300?text=Xiaomi+Backpack'],
        category: 'Аксессуары',
        brand: 'Xiaomi',
        rating: 4.4,
        reviews_count: 89,
        in_stock: true,
        stock: 30,
        sku: 'XMI-BPACK-BLK',
        marketplace: 'wildberries'
      },
      {
        store_id: store.id,
        wb_id: '100005',
        name: 'Фитнес-браслет Xiaomi Mi Band 7',
        description: 'Умный браслет с множеством функций для отслеживания здоровья',
        price: 3490,
        old_price: 4990,
        images: ['https://via.placeholder.com/300x300?text=Mi+Band+7'],
        category: 'Электроника',
        brand: 'Xiaomi',
        rating: 4.7,
        reviews_count: 456,
        in_stock: false,
        stock: 0,
        sku: 'XMI-BAND7-BLK',
        marketplace: 'wildberries'
      }
    ];

    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(testProducts)
      .select();

    if (productsError) {
      console.error('Error creating products:', productsError);
      return;
    }

    console.log(`Successfully created ${products.length} test products`);
    console.log('Test data added successfully!');
    
    // Выводим информацию о созданном магазине
    console.log('\nStore details:');
    console.log('- ID:', store.id);
    console.log('- Name:', store.name);
    console.log('- Products count:', products.length);

  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Запускаем скрипт
addTestData();
