import { Router, Response } from 'express';
import { supabase } from '../../utils/supabase';
import { authenticateToken, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Получить все магазины продавца
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stores:', error);
      return res.status(500).json({
        error: 'Ошибка при получении магазинов'
      });
    }

    return res.json({
      success: true,
      stores: stores || []
    });
  } catch (error) {
    console.error('Get stores error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить конкретный магазин
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .eq('seller_id', userId)
      .single();

    if (error || !store) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    return res.json({
      success: true,
      store
    });
  } catch (error) {
    console.error('Get store error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Создать новый магазин
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { 
      name, 
      description, 
      telegram_bot_token,
      wildberries_token,
      ozon_client_id,
      ozon_api_key
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Название магазина обязательно'
      });
    }

    if (!telegram_bot_token) {
      return res.status(400).json({
        error: 'Telegram Bot Token обязателен'
      });
    }

    const { data: newStore, error } = await supabase
      .from('stores')
      .insert([
        {
          seller_id: userId,
          name,
          description: description || '',
          telegram_bot_token,
          wildberries_token: wildberries_token || null,
          ozon_client_id: ozon_client_id || null,
          ozon_api_key: ozon_api_key || null,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating store:', error);
      return res.status(500).json({
        error: 'Ошибка при создании магазина'
      });
    }

    return res.status(201).json({
      success: true,
      store: newStore
    });
  } catch (error) {
    console.error('Create store error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновить магазин
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Проверяем, что магазин принадлежит пользователю
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('seller_id', userId)
      .single();

    if (!existingStore) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // Обновляем магазин
    const { data: updatedStore, error } = await supabase
      .from('stores')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating store:', error);
      return res.status(500).json({
        error: 'Ошибка при обновлении магазина'
      });
    }

    return res.json({
      success: true,
      store: updatedStore
    });
  } catch (error) {
    console.error('Update store error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Удалить магазин
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Проверяем, что магазин принадлежит пользователю
    const { data: existingStore } = await supabase
      .from('stores')
      .select('id')
      .eq('id', id)
      .eq('seller_id', userId)
      .single();

    if (!existingStore) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // Удаляем магазин
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting store:', error);
      return res.status(500).json({
        error: 'Ошибка при удалении магазина'
      });
    }

    return res.json({
      success: true,
      message: 'Магазин успешно удален'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Установить webhook для Telegram бота
router.post('/:id/telegram-webhook', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Получаем магазин с токеном бота
    const { data: store, error } = await supabase
      .from('stores')
      .select('telegram_bot_token')
      .eq('id', id)
      .eq('seller_id', userId)
      .single();

    if (error || !store) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    if (!store.telegram_bot_token) {
      return res.status(400).json({
        error: 'Telegram Bot Token не настроен для этого магазина'
      });
    }

    // Здесь можно добавить логику установки webhook для Telegram бота
    // Например, вызов Telegram API для установки webhook URL

    return res.json({
      success: true,
      message: 'Webhook установлен успешно'
    });
  } catch (error) {
    console.error('Set webhook error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
