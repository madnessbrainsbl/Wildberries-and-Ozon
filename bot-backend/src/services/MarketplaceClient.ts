import axios from 'axios';
import { supabase } from '../utils/supabase';
import { CartItem } from '../types';
import { logger } from '../utils/logger';

export interface MarketplaceSession {
  api_key?: string;
  client_id?: string;
  cookies?: string; // JSON stringified cookies if using browser fallback
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

/**
 * Thin wrapper over marketplace APIs.
 * Falls back to browser automation (via BrowserService) when API is not available
 * or user does not have programmatic credentials.
 */
export class MarketplaceClient {
  private marketplace: 'wildberries' | 'ozon';
  private session: MarketplaceSession;

  constructor(marketplace: 'wildberries' | 'ozon', session: MarketplaceSession) {
    this.marketplace = marketplace;
    this.session = session;
  }

  /** Adds selected items to marketplace cart */
  async addToCart(items: CartItem[]): Promise<boolean> {
    if (this.marketplace === 'wildberries') {
      return this.addToCartWB(items);
    }
    return this.addToCartOzon(items);
  }

  /** Creates an order and returns marketplace order id */
  async createOrder(): Promise<CreateOrderResult> {
    if (this.marketplace === 'wildberries') {
      return this.createOrderWB();
    }
    return this.createOrderOzon();
  }

  /** Polls order status via API */
  async fetchStatus(orderNumber: string): Promise<string | null> {
    if (this.marketplace === 'wildberries') {
      return this.fetchStatusWB(orderNumber);
    }
    return this.fetchStatusOzon(orderNumber);
  }

  // ============== WILDBERRIES ==============
  private async addToCartWB(items: CartItem[]): Promise<boolean> {
    if (!this.session.api_key) {
      logger.warn('WB api_key missing – skipping API addToCart');
      return false;
    }
    try {
      const reqBody = items.map(i => ({nmId: i.product.sku, quantity: i.quantity}));
      await axios.post('https://suppliers-api.wildberries.ru/api/v3/baskets/items/add', reqBody, {
        headers: { Authorization: this.session.api_key }
      });
      return true;
    } catch (e: any) {
      logger.error('WB addToCart error', e.response?.data || e.message);
      return false;
    }
  }

  private async createOrderWB(): Promise<CreateOrderResult> {
    if (!this.session.api_key) return { success: false, error: 'missing_wb_api_key' };
    try {
      const { data } = await axios.post('https://suppliers-api.wildberries.ru/api/v3/orders/new', {}, {
        headers: { Authorization: this.session.api_key }
      });
      return { success: true, orderNumber: data?.orderId?.toString() };
    } catch (e: any) {
      logger.error('WB createOrder error', e.response?.data || e.message);
      return { success: false, error: e.message };
    }
  }

  private async fetchStatusWB(orderNumber: string): Promise<string | null> {
    if (!this.session.api_key) return null;
    try {
      const { data } = await axios.get(`https://suppliers-api.wildberries.ru/api/v3/orders/${orderNumber}/status`, {
        headers: { Authorization: this.session.api_key }
      });
      return data?.status || null;
    } catch {
      return null;
    }
  }

  // ============== OZON ==============
  private async addToCartOzon(items: CartItem[]): Promise<boolean> {
    if (!this.session.api_key || !this.session.client_id) {
      logger.warn('Ozon credentials missing – skipping API addToCart');
      return false;
    }
    try {
      await axios.post('https://api-seller.ozon.ru/v1/cart/add', { items: items.map(i => ({ offer_id: i.product.sku, quantity: i.quantity })) }, {
        headers: {
          'Client-Id': this.session.client_id,
          'Api-Key': this.session.api_key,
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (e: any) {
      logger.error('Ozon addToCart error', e.response?.data || e.message);
      return false;
    }
  }

  private async createOrderOzon(): Promise<CreateOrderResult> {
    if (!this.session.api_key || !this.session.client_id) return { success: false, error: 'missing_ozon_credentials' };
    try {
      const { data } = await axios.post('https://api-seller.ozon.ru/v1/order/create', {}, {
        headers: {
          'Client-Id': this.session.client_id,
          'Api-Key': this.session.api_key,
          'Content-Type': 'application/json'
        }
      });
      return { success: true, orderNumber: data?.result?.order_id?.toString() };
    } catch (e: any) {
      logger.error('Ozon createOrder error', e.response?.data || e.message);
      return { success: false, error: e.message };
    }
  }

  private async fetchStatusOzon(orderNumber: string): Promise<string | null> {
    if (!this.session.api_key || !this.session.client_id) return null;
    try {
      const { data } = await axios.post('https://api-seller.ozon.ru/v2/posting/fbs/get', { posting_number: orderNumber }, {
        headers: {
          'Client-Id': this.session.client_id,
          'Api-Key': this.session.api_key,
          'Content-Type': 'application/json'
        }
      });
      return data?.result?.status || null;
    } catch {
      return null;
    }
  }
}

