import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для аутентификации
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Store {
  id: string
  name: string
  description: string
  telegram_bot_token: string
  wildberries_token: string
  ozon_client_id: string
  ozon_api_key: string
  owner_id: string
  created_at: string
  updated_at: string
  status: 'active' | 'inactive'
}

export interface Product {
  id: string
  store_id: string
  wb_id: string | null
  marketplace: string
  marketplace_id: string
  name: string
  description: string
  price: number
  old_price?: number
  stock?: number
  reserved?: number
  sku?: string
  images: string[]
  category: string
  brand: string
  rating: number
  reviews_count: number
  in_stock: boolean
  properties?: any
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  store_id: string
  customer_telegram_id: string
  customer_name: string
  products: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  total_amount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
}

// Функции для работы с аутентификацией
export const auth = {
  // Получить текущего пользователя
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Получить текущего пользователя синхронно из сессии
  user: () => {
    const { data: { session } } = supabase.auth.getSession()
    return session?.user || null
  },

  // Выйти из системы
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Подписаться на изменения состояния аутентификации
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}
