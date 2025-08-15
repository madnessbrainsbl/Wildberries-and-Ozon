import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем переменные окружения
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Ошибка: не найдены переменные окружения VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ID магазина для которого добавляем товары
const STORE_ID = '5358ebd1-d90b-4c55-a0ff-f8840f8da283'

// Тестовые товары
const testProducts = [
  // Wildberries товары
  {
    store_id: STORE_ID,
    wb_id: '123456789',
    marketplace: 'wildberries',
    marketplace_id: '123456789',
    name: 'Смартфон Samsung Galaxy A54 8/256GB',
    description: 'Современный смартфон с отличной камерой и производительностью. Экран 6.4", процессор Exynos 1380, батарея 5000 мАч.',
    price: 32990,
    old_price: 45990,
    stock: 50,
    reserved: 5,
    sku: 'SM-A546EZKDSER',
    images: [
      'https://basket-01.wb.ru/vol123/part12345/12345678/images/big/1.jpg',
      'https://basket-01.wb.ru/vol123/part12345/12345678/images/big/2.jpg'
    ],
    category: 'Электроника',
    brand: 'Samsung',
    rating: 4.5,
    reviews_count: 234,
    in_stock: true,
    properties: {
      originalPrice: 45990,
      color: 'Черный',
      memory: '256GB',
      ram: '8GB'
    }
  },
  {
    store_id: STORE_ID,
    wb_id: '987654321',
    marketplace: 'wildberries',
    marketplace_id: '987654321',
    name: 'Наушники Apple AirPods Pro 2',
    description: 'Беспроводные наушники с активным шумоподавлением. Время работы до 30 часов с кейсом.',
    price: 19990,
    old_price: 24990,
    stock: 30,
    reserved: 2,
    sku: 'MQD83RU/A',
    images: [
      'https://basket-02.wb.ru/vol987/part98765/98765432/images/big/1.jpg'
    ],
    category: 'Аудио',
    brand: 'Apple',
    rating: 4.8,
    reviews_count: 567,
    in_stock: true,
    properties: {
      originalPrice: 24990,
      connectivity: 'Bluetooth 5.3',
      noiseCancellation: true
    }
  },
  {
    store_id: STORE_ID,
    wb_id: '456789123',
    marketplace: 'wildberries',
    marketplace_id: '456789123',
    name: 'Кроссовки Nike Air Max 270',
    description: 'Стильные кроссовки для повседневной носки. Воздушная подушка Air Max обеспечивает комфорт.',
    price: 8990,
    old_price: 12990,
    stock: 15,
    reserved: 1,
    sku: 'AH8050-002',
    images: [
      'https://basket-03.wb.ru/vol456/part45678/45678912/images/big/1.jpg'
    ],
    category: 'Обувь',
    brand: 'Nike',
    rating: 4.6,
    reviews_count: 89,
    in_stock: true,
    properties: {
      originalPrice: 12990,
      size: '42',
      color: 'Черный/Белый',
      material: 'Текстиль/Резина'
    }
  },
  // Ozon товары
  {
    store_id: STORE_ID,
    wb_id: null,
    marketplace: 'ozon',
    marketplace_id: '234567890',
    name: 'Ноутбук ASUS VivoBook 15',
    description: 'Ноутбук для работы и учебы. Процессор Intel Core i5, 8GB RAM, SSD 512GB, экран 15.6" Full HD.',
    price: 54990,
    old_price: 69990,
    stock: 10,
    reserved: 0,
    sku: 'X515EA-BQ1189',
    images: [
      'https://cdn1.ozon.ru/s3/multimedia-1/c1000/6234567890.jpg'
    ],
    category: 'Компьютеры',
    brand: 'ASUS',
    rating: 4.4,
    reviews_count: 123,
    in_stock: true,
    properties: {
      originalPrice: 69990,
      processor: 'Intel Core i5-1135G7',
      ram: '8GB DDR4',
      storage: '512GB SSD'
    }
  },
  {
    store_id: STORE_ID,
    wb_id: null,
    marketplace: 'ozon',
    marketplace_id: '345678901',
    name: 'Робот-пылесос Xiaomi Mi Robot Vacuum',
    description: 'Умный робот-пылесос с функцией влажной уборки. Управление через приложение, построение карты помещения.',
    price: 24990,
    old_price: 34990,
    stock: 20,
    reserved: 3,
    sku: 'BHR4421GL',
    images: [
      'https://cdn1.ozon.ru/s3/multimedia-2/c1000/6345678901.jpg'
    ],
    category: 'Бытовая техника',
    brand: 'Xiaomi',
    rating: 4.7,
    reviews_count: 456,
    in_stock: true,
    properties: {
      originalPrice: 34990,
      cleaningModes: 4,
      batteryLife: '180 мин',
      mapping: true
    }
  },
  {
    store_id: STORE_ID,
    wb_id: null,
    marketplace: 'ozon',
    marketplace_id: '456789012',
    name: 'Фитнес-браслет Mi Band 7',
    description: 'Фитнес-трекер с цветным экраном. Мониторинг сна, пульса, 120+ спортивных режимов.',
    price: 3490,
    old_price: 4990,
    stock: 100,
    reserved: 10,
    sku: 'BHR5423GL',
    images: [
      'https://cdn1.ozon.ru/s3/multimedia-3/c1000/6456789012.jpg'
    ],
    category: 'Гаджеты',
    brand: 'Xiaomi',
    rating: 4.5,
    reviews_count: 789,
    in_stock: true,
    properties: {
      originalPrice: 4990,
      screenSize: '1.62"',
      waterproof: '5ATM',
      batteryLife: '14 дней'
    }
  }
]

async function addTestProducts() {
  console.log('Начинаем добавление тестовых товаров...')
  
  try {
    // Сначала проверим, существует ли магазин
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('id', STORE_ID)
      .single()
    
    if (storeError || !store) {
      console.error('Ошибка: магазин с ID', STORE_ID, 'не найден')
      console.error('Детали ошибки:', storeError)
      return
    }
    
    console.log('Магазин найден, добавляем товары...')
    
    // Добавляем товары
    const { data, error } = await supabase
      .from('products')
      .insert(testProducts)
      .select()
    
    if (error) {
      console.error('Ошибка при добавлении товаров:', error)
      return
    }
    
    console.log(`Успешно добавлено ${data.length} товаров:`)
    data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.marketplace}) - ${product.price}₽`)
    })
    
  } catch (error) {
    console.error('Неожиданная ошибка:', error)
  }
}

// Запускаем скрипт
addTestProducts()
