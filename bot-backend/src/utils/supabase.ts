import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Initializing Supabase client with URL:', supabaseUrl);
console.log('Supabase anon key present:', !!supabaseAnonKey);
console.log('Supabase service key present:', !!supabaseServiceKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
}

// Обычный клиент для аутентификации
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service клиент для обхода RLS (только для серверных операций)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback на обычный клиент если нет service key

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          telegram_id: number;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          telegram_id: number;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          telegram_id?: number;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          marketplace: 'wildberries' | 'ozon';
          marketplace_order_id: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          marketplace: 'wildberries' | 'ozon';
          marketplace_order_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          total_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          marketplace?: 'wildberries' | 'ozon';
          marketplace_order_id?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
      marketplace_accounts: {
        Row: {
          id: string;
          user_id: string;
          marketplace: 'wildberries' | 'ozon';
          phone: string | null;
          email: string | null;
          is_authenticated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          marketplace: 'wildberries' | 'ozon';
          phone?: string | null;
          email?: string | null;
          is_authenticated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          marketplace?: 'wildberries' | 'ozon';
          phone?: string | null;
          email?: string | null;
          is_authenticated?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
