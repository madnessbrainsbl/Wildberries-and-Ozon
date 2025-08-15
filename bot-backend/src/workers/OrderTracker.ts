import cron from 'node-cron';
import { supabase } from '../utils/supabase';
import { MarketplaceClient } from '../services/MarketplaceClient';
import { logger } from '../utils/logger';

const POLL_INTERVAL_CRON = process.env.ORDER_TRACK_CRON || '*/10 * * * *'; // every 10 min

async function pollOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'processing', 'completed']) // we still update completed for delivery status
    .neq('marketplace_order_id', null);

  if (error) {
    logger.error({ err: error }, 'Failed to fetch orders');
    return;
  }

  for (const order of orders || []) {
    try {
      const credsRes = await supabase
        .from('stores')
        .select('wildberries_token, ozon_api_key, ozon_client_id')
        .eq('id', order.store_id)
        .single();

      if (credsRes.error || !credsRes.data) continue;

      const client = new MarketplaceClient(order.marketplace, {
        api_key: order.marketplace === 'wildberries' ? credsRes.data.wildberries_token : credsRes.data.ozon_api_key,
        client_id: order.marketplace === 'ozon' ? credsRes.data.ozon_client_id : undefined,
      });

      const status = await client.fetchStatus(order.marketplace_order_id);
      if (!status) continue;

      if (status !== order.status) {
        await supabase.from('orders').update({ status }).eq('id', order.id);
        logger.info({ orderId: order.id, status }, 'Order status updated');
      }
    } catch (e) {
      logger.error(e, 'Error polling order');
    }
  }
}

cron.schedule(POLL_INTERVAL_CRON, pollOrders);

logger.info(`Order tracker started. Schedule: ${POLL_INTERVAL_CRON}`);

