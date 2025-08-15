import { Router, Response } from 'express';
import { supabase } from '../../utils/supabase';
import { authenticateToken, AuthRequest } from '../../middleware/auth.middleware';

const router = Router();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// Получить все товары магазина
router.get('/store/:storeId', async (req: AuthRequest, res: Response) => {
  try {
    const { storeId } = req.params;
    const userId = req.user?.id;

    // Проверяем, что магазин принадлежит пользователю
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('seller_id', userId)
      .single();

    if (!store) {
      return res.status(403).json({
        error: 'Нет доступа к этому магазину'
      });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        error: 'Ошибка при получении товаров'
      });
    }

    return res.json({
      success: true,
      products: products || []
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить конкретный товар
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(*)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Проверяем, что магазин принадлежит пользователю
    if (product.store.seller_id !== userId) {
      return res.status(403).json({
        error: 'Нет доступа к этому товару'
      });
    }

    return res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Синхронизировать товары с маркетплейсом
router.post('/sync/:storeId', async (req: AuthRequest, res: Response) => {
  try {
    const { storeId } = req.params;
    const { marketplace } = req.body; // 'wildberries' или 'ozon'
    const userId = req.user?.id;

    if (!marketplace || !['wildberries', 'ozon'].includes(marketplace)) {
      return res.status(400).json({
        error: 'Укажите корректный маркетплейс (wildberries или ozon)'
      });
    }

    // Проверяем, что магазин принадлежит пользователю
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('seller_id', userId)
      .single();

    if (!store) {
      return res.status(403).json({
        error: 'Нет доступа к этому магазину'
      });
    }

    // Проверяем наличие токенов для выбранного маркетплейса
    if (marketplace === 'wildberries' && !store.wildberries_token) {
      return res.status(400).json({
        error: 'Не настроен токен Wildberries'
      });
    }

    if (marketplace === 'ozon' && (!store.ozon_client_id || !store.ozon_api_key)) {
      return res.status(400).json({
        error: 'Не настроены учетные данные Ozon'
      });
    }

    // Здесь должна быть логика синхронизации с маркетплейсом
    // Пока возвращаем заглушку
    return res.json({
      success: true,
      message: `Синхронизация с ${marketplace} запущена`,
      synced_count: 0
    });
  } catch (error) {
    console.error('Sync products error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновить товар
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updates = req.body;

    // Получаем товар с информацией о магазине
    const { data: product } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(seller_id)
      `)
      .eq('id', id)
      .single();

    if (!product || product.store.seller_id !== userId) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Обновляем товар
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({
        error: 'Ошибка при обновлении товара'
      });
    }

    return res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Удалить товар
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Получаем товар с информацией о магазине
    const { data: product } = await supabase
      .from('products')
      .select(`
        *,
        store:stores(seller_id)
      `)
      .eq('id', id)
      .single();

    if (!product || product.store.seller_id !== userId) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Удаляем товар
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({
        error: 'Ошибка при удалении товара'
      });
    }

    return res.json({
      success: true,
      message: 'Товар успешно удален'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      error: 'Внутренняя ошибка сервера'
    });
  }
});

export default router;
