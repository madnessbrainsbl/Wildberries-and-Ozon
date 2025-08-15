export interface AuthSession {
  userId: string;
  marketplace: 'wildberries' | 'ozon';
  step: 'phone' | 'code';
  phoneOrEmail?: string;
  identifier?: string; // phone or email stored for OTP verification
  browser?: any; // BrowserService instance for ongoing login
}

export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  marketplace: 'wildberries' | 'ozon';
  sku: string;
  image_url?: string;
  description?: string;
  category?: string;
  in_stock?: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  marketplace: 'wildberries' | 'ozon';
  marketplace_order_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  items: OrderItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface MarketplaceAccount {
  id: string;
  user_id: string;
  marketplace: 'wildberries' | 'ozon';
  phone?: string;
  email?: string;
  is_authenticated: boolean;
  created_at: string;
}

