import { supabase } from '../utils/supabase';
import { Order, CartItem } from '../types';
import { MarketplaceClient } from './MarketplaceClient';
import { MarketplaceAuthService } from './MarketplaceAuthService';
import { logger } from '../utils/logger';

let BrowserService: any;

if (process.env.DISABLE_BROWSER === 'true') {
  BrowserService = require('./BrowserService.prod').BrowserService;
} else {
  BrowserService = require('./BrowserService').BrowserService;
}

export class OrderService {
  private browserService: any;

  constructor() {
    this.browserService = new BrowserService();
  }

  async createOrder(userId: string, marketplace: 'wildberries' | 'ozon', items: CartItem[]): Promise<Order | null> {
    try {
      // First, we need to get or create customer based on user's telegram_id
      const { data: user } = await supabase
        .from('users')
        .select('telegram_id')
        .eq('id', userId)
        .single();

      if (!user) {
        console.error('User not found for ID:', userId);
        return null;
      }

      // Get or create customer
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('telegram_id', user.telegram_id.toString())
        .single();

      if (!customer) {
        // Create customer if doesn't exist
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            telegram_id: user.telegram_id.toString()
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
          return null;
        }
        customer = newCustomer;
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      // Get store for this user
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (!store) {
        console.error('Store not found for user:', userId);
        return null;
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store.id,
          customer_id: customer!.id,
          order_number: `ORD-${Date.now()}`,
          status: 'pending',
          total_amount: totalAmount,
          marketplace: marketplace
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  async processOrder(orderId: string, items: CartItem[]): Promise<string | null> {
    try {
      // Get order details
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !order) throw new Error('Order not found');

      // Update order status to processing
      await this.updateOrderStatus(orderId, 'processing');

      let orderNumber: string | null = null;

      // --- Try API first ---
      const creds = await MarketplaceAuthService.getApiCredentials(order.user_id, order.marketplace);
      if (creds) {
        const mpClient = new MarketplaceClient(order.marketplace, creds);
        const apiCart = await mpClient.addToCart(items);
        if (apiCart) {
          const createRes = await mpClient.createOrder();
          if (createRes.success && createRes.orderNumber) {
            orderNumber = createRes.orderNumber;
            logger.info({ orderId, orderNumber }, 'Order created via API');
          }
        }
      }

      // --- Fallback to browser if API failed ---
      if (!orderNumber) {
        logger.warn({ orderId }, 'API order failed or missing creds – falling back to browser');
        await this.browserService.init();
        if (order.marketplace === 'wildberries') {
          const cartSuccess = await this.browserService.addToCartWildberries(items);
          if (!cartSuccess) throw new Error('Failed to add items to cart');
          orderNumber = await this.browserService.checkoutWildberries();
        } else {
          const cartSuccess = await this.browserService.addToCartOzon(items);
          if (!cartSuccess) throw new Error('Failed to add items to cart');
          orderNumber = await this.browserService.checkoutOzon();
        }
        await this.browserService.close();
      }
      if (orderNumber) {
        // Update order with marketplace order number
        await supabase
          .from('orders')
          .update({
            marketplace_order_id: orderNumber,
            status: 'completed'
          })
          .eq('id', orderId);

        return orderNumber;
      } else {
        await this.updateOrderStatus(orderId, 'failed');
        return null;
      }
    } catch (error) {
      console.error('Error processing order:', error);
      await this.updateOrderStatus(orderId, 'failed');
      await this.browserService.close();
      return null;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return data as Order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      // First get the store for this user
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .single();

      if (!store) {
        console.log('No store found for user:', userId);
        return [];
      }

      // Get orders for this store
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user orders:', error);
        return [];
      }

      return data as Order[];
    } catch (error) {
      console.error('Error in getUserOrders:', error);
      return [];
    }
  }

  async trackOrder(orderId: string, marketplace: 'wildberries' | 'ozon', marketplaceOrderId: string) {
    // This would integrate with marketplace APIs to track order status
    // For now, just return the current status from database
    const order = await this.getOrder(orderId);
    return order?.status || 'unknown';
  }
}
