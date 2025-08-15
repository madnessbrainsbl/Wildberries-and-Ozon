import TelegramBot from 'node-telegram-bot-api';
import { OrderService } from '../services/OrderService';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { CartItem, User, AuthSession } from '../types';
import { UserService } from '../services/UserService';
import { MarketplaceAuthService } from '../services/MarketplaceAuthService';
import { BrowserService } from '../services/BrowserService';

export class BotController {
  private bot: TelegramBot;
  private orderService: OrderService;
  private authSessions: Map<number, AuthSession> = new Map();
  private userCarts: Map<number, CartItem[]> = new Map();
  private sessionTimeouts: Map<number, NodeJS.Timeout> = new Map();

  constructor(token: string) {
    // Configure bot with polling options to avoid conflicts
    this.bot = new TelegramBot(token, { 
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    
    this.orderService = new OrderService();
    
    // Handle polling errors
    this.bot.on('polling_error', (error: any) => {
      console.error('Polling error:', error);
      if (error.code === 'ETELEGRAM' && error.message?.includes('409')) {
        console.log('Another instance is running. Stopping polling...');
        this.bot.stopPolling();
        setTimeout(() => {
          console.log('Attempting to restart polling...');
          this.bot.startPolling();
        }, 5000);
      }
    });
    
    this.setupListeners();
  }

  private setupListeners() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!userId) return;

      // Check if user exists, create if not
      if (msg.from) {
        await this.ensureUser(userId, msg.from);
      }

const miniAppUrl = 'https://teleshop.su/miniapp/5358ebd1-d90b-4c55-a0ff-f8840f8da283';
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ 
              text: 'Открыть магазин', 
              web_app: { url: miniAppUrl }
            }],
            [{ text: 'Мои заказы', callback_data: 'my_orders' }],
            [{ text: 'Привязать аккаунты', callback_data: 'link_accounts' }]
          ]
        }
      };

      this.bot.sendMessage(chatId, 
        `Добро пожаловать в бот для покупок!\n\n` +
        `Я помогу вам совершать покупки на Wildberries и Ozon.\n\n` +
        `Нажмите "Открыть магазин" для выбора товаров`,
        keyboard
      );
    });

  // Handle callback queries
  this.bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    const userId = query.from.id;

    if (!chatId) return;
    
    // Ensure user exists in database before processing any callback
    if (query.from) {
      await this.ensureUser(userId, query.from);
    }

    switch (query.data) {
        case 'browse_products':
          await this.showProductCategories(chatId);
          break;
        case 'view_cart':
          await this.showCart(chatId, userId);
          break;
        case 'my_orders':
          const userUuid = await this.getUserIdByTelegramId(userId);
          if (userUuid) {
            await this.showUserOrders(chatId, userUuid);
          } else {
            this.bot.sendMessage(chatId, '❌ User not found. Please start the bot again.');
          }
          break;
        case 'link_accounts':
          await this.showLinkAccountsMenu(chatId);
          break;
        case 'link_wildberries':
          await this.startMarketplaceAuth(chatId, userId, 'wildberries', query.from);
          break;
        case 'link_ozon':
          await this.startMarketplaceAuth(chatId, userId, 'ozon', query.from);
          break;
      }

      // Handle product selection
      if (query.data?.startsWith('add_to_cart_')) {
        const productId = query.data.replace('add_to_cart_', '');
        await this.addToCart(chatId, userId, productId);
      } else if (query.data?.startsWith('category_')) {
        const category = query.data.replace('category_', '');
        await this.showProductsByCategory(chatId, category);
      } else if (query.data === 'clear_cart') {
        this.userCarts.delete(userId);
        this.bot.answerCallbackQuery(query.id, {
          text: '🗑 Корзина очищена',
          show_alert: false
        });
        await this.showCart(chatId, userId);
      } else if (query.data === '/start') {
        // Directly handle start command
        await this.handleStartCommand(chatId, userId, query.from);
      }

      this.bot.answerCallbackQuery(query.id);
    });

    // Handle phone/email input for authentication
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const text = msg.text;

      if (!userId || !text || text.startsWith('/')) return;

      const session = this.authSessions.get(userId);
      if (!session) return;

      if (session.step === 'phone') {
        // User sent phone number
        await this.handlePhoneInput(chatId, userId, text, session);
      } else if (session.step === 'code') {
        // User sent verification code
        await this.handleCodeInput(chatId, userId, text, session);
      }
    });

    // Handle web app data (cart from miniapp)
    this.bot.on('web_app_data', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      if (!userId) return;

      try {
        const data = JSON.parse(msg.web_app_data?.data || '{}');
        
        if (data.action === 'checkout' && data.cart) {
          // Save cart for user
          this.userCarts.set(userId, data.cart);
          
          // Show checkout options
          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🟣 Checkout on Wildberries', callback_data: 'checkout_wildberries' }],
                [{ text: '🔵 Checkout on Ozon', callback_data: 'checkout_ozon' }]
              ]
            }
          };

          const cartSummary = data.cart.map((item: CartItem) => 
            `• ${item.product.name} x${item.quantity} - ${item.product.price * item.quantity}₽`
          ).join('\n');

          this.bot.sendMessage(chatId,
            `🛒 Your Cart:\n\n${cartSummary}\n\n` +
            `Total: ${data.cart.reduce((sum: number, item: CartItem) => sum + item.product.price * item.quantity, 0)}₽\n\n` +
            `Choose marketplace for checkout:`,
            keyboard
          );
        }
      } catch (error) {
        console.error('Error parsing web app data:', error);
      }
    });

    // Handle checkout
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const userId = query.from.id;

      if (!chatId || !query.data?.startsWith('checkout_')) return;

      const marketplace = query.data.replace('checkout_', '') as 'wildberries' | 'ozon';
      const cart = this.userCarts.get(userId);

      if (!cart || cart.length === 0) {
        this.bot.sendMessage(chatId, '❌ Your cart is empty!');
        return;
      }

      // Get user UUID
      const userUuid = await this.getUserIdByTelegramId(userId);
      if (!userUuid) {
        this.bot.sendMessage(chatId, '❌ User not found. Please start the bot again.');
        return;
      }

      // Check if user has a store with this marketplace configured
      const { data: store } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userUuid)
        .eq('status', 'active')
        .single();

      if (!store) {
        this.bot.sendMessage(chatId, 
          `❌ You need to link your ${marketplace} account first!\n\n` +
          `Use /start and click "Link Accounts" to connect your account.`
        );
        return;
      }

      // Process checkout
      await this.processCheckout(chatId, userUuid, marketplace, cart);
    });
  }

  private async ensureUser(telegramId: number, from: TelegramBot.User): Promise<string> {
    return await UserService.ensureUser(telegramId, from);
  }

  private async getUserIdByTelegramId(telegramId: number): Promise<string | null> {
    return await UserService.getUserIdByTelegramId(telegramId);
  }

  private async showUserOrders(chatId: number, userId: string) {
    try {
      const orders = await this.orderService.getUserOrders(userId);

      if (orders.length === 0) {
        this.bot.sendMessage(chatId, '📦 У вас пока нет заказов.\n\nДля оформления заказа выберите товары и добавьте их в корзину.');
        return;
      }

      const ordersList = orders.map(order => 
        `📦 Заказ #${order.marketplace_order_id || order.id.slice(0, 8)}\n` +
        `Маркетплейс: ${order.marketplace}\n` +
        `Статус: ${order.status}\n` +
        `Сумма: ${order.total_amount}₽\n` +
        `Дата: ${new Date(order.created_at).toLocaleDateString()}`
      ).join('\n\n');

      this.bot.sendMessage(chatId, `📦 Ваши заказы:\n\n${ordersList}`);
    } catch (error) {
      console.error('Error in showUserOrders:', error);
      this.bot.sendMessage(chatId, '📦 У вас пока нет заказов.\n\nДля оформления заказа выберите товары и добавьте их в корзину.');
    }
  }

  private async showLinkAccountsMenu(chatId: number) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟣 Link Wildberries', callback_data: 'link_wildberries' }],
          [{ text: '🔵 Link Ozon', callback_data: 'link_ozon' }]
        ]
      }
    };

    this.bot.sendMessage(chatId, 
      '🔐 Link your marketplace accounts to enable automatic checkout:\n\n' +
      'Choose a marketplace:',
      keyboard
    );
  }

  private async startMarketplaceAuth(chatId: number, userId: number, marketplace: 'wildberries' | 'ozon', from?: TelegramBot.User) {
    
    // Check if user already has an active auth session
    if (this.authSessions.has(userId)) {
      this.bot.sendMessage(chatId, 
        'У вас уже есть активная сессия авторизации.\n\n' +
        'Пожалуйста, завершите её или подождите и попробуйте снова.'
      );
      return;
    }

    // Get user UUID - first ensure user exists in database
    let userUuid: string | null = null;
    try {
      // First try to get existing user
      userUuid = await UserService.getUserIdByTelegramId(userId);
      
      // If user doesn't exist, create them
      if (!userUuid && from) {
        console.log(`User ${userId} not found, creating...`);
        userUuid = await UserService.ensureUser(userId, from);
      }
      
      if (!userUuid) {
        console.error('Failed to get or create user ID');
        this.bot.sendMessage(chatId, 'Ошибка при получении данных пользователя. Попробуйте позже.');
        return;
      }
    } catch (error) {
      console.error('Unexpected error in user management:', error);
      this.bot.sendMessage(chatId, 'Произошла неожиданная ошибка. Попробуйте позже.');
      return;
    }

    // Create auth session
    this.authSessions.set(userId, {
      userId: userUuid,
      marketplace,
      step: 'phone'
    });

    const message = marketplace === 'wildberries' 
      ? 'Введите номер телефона для Wildberries (формат: +7XXXXXXXXXX):'
      : 'Введите номер телефона или email для Ozon:';

    this.bot.sendMessage(chatId, message);
  }

  private async handlePhoneInput(chatId: number, userId: number, phoneOrEmail: string, session: AuthSession) {
    session.phoneOrEmail = phoneOrEmail;

    // Запускаем браузерный логин
    const browser = new BrowserService();
    try {
      console.log(`Starting browser automation for ${session.marketplace}...`);
      await browser.init();
      
      let loginOk = false;
      if (session.marketplace === 'wildberries') {
        loginOk = await browser.loginToWildberries(phoneOrEmail);
      } else {
        loginOk = await browser.loginToOzon(phoneOrEmail);
      }

      if (!loginOk) {
        await browser.close();
        this.bot.sendMessage(chatId, '❌ Не удалось открыть страницу входа. Попробуйте позже.');
        this.authSessions.delete(userId);
        return;
      }

      // если всё ок – ждём код
      session.step = 'code';
      session.browser = browser;
      this.bot.sendMessage(chatId, '✅ Страница входа открыта. Введите код подтверждения из SMS/Email:');
    } catch (error) {
      console.error('Error in browser automation:', error);
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
      this.bot.sendMessage(chatId, '❌ Ошибка при запуске браузера. Проверьте логи или попробуйте позже.');
      this.authSessions.delete(userId);
    }
  }

  private async handleCodeInput(chatId: number, userId: number, code: string, session: AuthSession) {
    this.bot.sendMessage(chatId, 'Проверяем код...');

    let success = false;

    if (session.browser) {
      // передаём код в открытый браузер
      if (session.marketplace === 'wildberries') {
        success = await session.browser.enterWildberriesCode(code);
      } else {
        success = await session.browser.enterOzonCode(code);
      }
    }

    if (success) {
      // Save account info to database
      try {
        // В зависимости от маркетплейса сохраняем соответствующие данные
        const accountData: any = {
          user_id: session.userId,
          marketplace: session.marketplace,
          is_authenticated: true
        };

        // Добавляем phone или email
        if (session.phoneOrEmail) {
          if (session.phoneOrEmail.includes('@')) {
            accountData.email = session.phoneOrEmail;
          } else {
            accountData.phone = session.phoneOrEmail;
          }
        }

        // Find or create store for this user and marketplace
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', session.userId)
          .eq('status', 'active')
          .single();

        if (!existingStore) {
          // Create a new store for this user
          const storeData = {
            name: `${session.marketplace} Store`,
            description: `Automated store for ${session.marketplace}`,
            owner_id: session.userId,
            status: 'active',
            telegram_bot_token: process.env.BOT_TOKEN || 'dummy_token_for_marketplace_integration',
            wildberries_token: '',   // Required field, empty for now
            settings: {
              marketplace: session.marketplace,
              phone: session.phoneOrEmail?.includes('@') ? null : session.phoneOrEmail,
              email: session.phoneOrEmail?.includes('@') ? session.phoneOrEmail : null,
              is_authenticated: true
            }
          };

          // Временное решение: используем обычный клиент и обрабатываем ошибку RLS
          const { error } = await supabase
            .from('stores')
            .insert(storeData);

          if (error && error.code !== '42501') {
            // Если это не ошибка RLS, выбрасываем ее
            console.error('Error creating store:', error);
            throw error;
          } else if (error && error.code === '42501') {
            // Для RLS ошибки просто логируем и продолжаем
            console.log('RLS policy prevented store creation, but continuing for testing...');
            console.log('Store data that would be created:', storeData);
          }
        } else {
          // Update existing store settings
          const { error } = await supabase
            .from('stores')
            .update({
              settings: {
                marketplace: session.marketplace,
                phone: session.phoneOrEmail?.includes('@') ? null : session.phoneOrEmail,
                email: session.phoneOrEmail?.includes('@') ? session.phoneOrEmail : null,
                is_authenticated: true
              }
            })
            .eq('id', existingStore.id);

          if (error) {
            console.error('Error updating store:', error);
            throw error;
          }
        }

        // Сохраняем cookies после успешного входа
        try {
          const cookies = await session.browser?.saveCookies();
          if (cookies && cookies.length) {
            const { data: store } = await supabase
              .from('stores')
              .select('id, settings')
              .eq('owner_id', session.userId)
              .single();
            if (store) {
              await supabase
                .from('stores')
                .update({ settings: { ...store.settings, cookies: JSON.stringify(cookies), is_authenticated: true } })
                .eq('id', store.id);
            }
          }
        } catch(_e) {}

        const marketplaceName = session.marketplace === 'wildberries' ? 'Wildberries' : 'Ozon';
        this.bot.sendMessage(chatId, 
          `✅ Аккаунт ${marketplaceName} успешно привязан!\n\n` +
          `Теперь вы можете оформлять заказы через бота.`
        );
      } catch (error) {
        console.error('Unexpected error saving marketplace account:', error);
        this.bot.sendMessage(chatId, 
          `⚠️ Авторизация прошла успешно, но произошла непредвиденная ошибка.\n\n` +
          `Попробуйте еще раз позже.`
        );
      }
    } else {
      this.bot.sendMessage(chatId, 'Неверный код. Проверьте телефон и попробуйте еще раз.');
    }

    // Clean up
    await session.browser?.close();
    this.authSessions.delete(userId);
  }

  private async processCheckout(chatId: number, userId: string, marketplace: 'wildberries' | 'ozon', cart: CartItem[]) {
    this.bot.sendMessage(chatId, '⏳ Processing your order...');

    // Create order
    const order = await this.orderService.createOrder(userId, marketplace, cart);
    
    if (!order) {
      this.bot.sendMessage(chatId, '❌ Failed to create order. Please try again.');
      return;
    }

    // Process order (add to cart and checkout)
    const orderNumber = await this.orderService.processOrder(order.id, cart);

    if (orderNumber) {
      this.bot.sendMessage(chatId,
        `✅ Order placed successfully!\n\n` +
        `Order Number: ${orderNumber}\n` +
        `Marketplace: ${marketplace}\n\n` +
        `You can track your order status using /start → My Orders`
      );
      
      // Clear user's cart
      this.userCarts.delete(Number(userId));
    } else {
      this.bot.sendMessage(chatId, 
        '❌ Failed to process order. Please try again or contact support.'
      );
    }
  }

  private async showProductCategories(chatId: number) {
    // Get unique categories from products
    const { data: products } = await supabase
      .from('products')
      .select('category')
      .eq('in_stock', true);

    const categories = [...new Set(products?.map(p => p.category).filter(Boolean) || [])];
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Все товары', callback_data: 'category_all' }],
          ...categories.map(cat => 
            [{ text: cat, callback_data: `category_${cat}` }]
          ),
          [{ text: '↩️ Назад', callback_data: '/start' }]
        ]
      }
    };

    this.bot.sendMessage(chatId, '📂 Выберите категорию товаров:', keyboard);
  }

  private async showProductsByCategory(chatId: number, category: string) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .limit(10);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: products } = await query;

    if (!products || products.length === 0) {
      this.bot.sendMessage(chatId, '😔 В этой категории пока нет товаров.');
      return;
    }

    for (const product of products) {
      const caption = 
        `🏷 **${product.name}**\n\n` +
        `💰 Цена: ${product.price}₽\n` +
        `📦 ${product.marketplace === 'wildberries' ? 'Wildberries' : 'Ozon'}\n` +
        (product.description ? `\n📝 ${product.description}\n` : '');

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 Добавить в корзину', callback_data: `add_to_cart_${product.id}` }]
          ]
        }
      };

      if (product.image_url) {
        try {
          await this.bot.sendPhoto(chatId, product.image_url, {
            caption,
            parse_mode: 'Markdown',
            ...keyboard
          });
        } catch (error) {
          await this.bot.sendMessage(chatId, caption, {
            parse_mode: 'Markdown',
            ...keyboard
          });
        }
      } else {
        await this.bot.sendMessage(chatId, caption, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      }
    }

    const backKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '↩️ К категориям', callback_data: 'browse_products' }],
          [{ text: '🛒 Корзина', callback_data: 'view_cart' }]
        ]
      }
    };

    this.bot.sendMessage(chatId, 'Выберите действие:', backKeyboard);
  }

  private async addToCart(chatId: number, userId: number, productId: string) {
    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      this.bot.answerCallbackQuery(chatId.toString(), {
        text: '❌ Товар не найден',
        show_alert: true
      });
      return;
    }

    // Get current cart
    const cart = this.userCarts.get(userId) || [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ product, quantity: 1 });
    }

    this.userCarts.set(userId, cart);

    this.bot.answerCallbackQuery(chatId.toString(), {
      text: `✅ ${product.name} добавлен в корзину`,
      show_alert: false
    });
  }

  private async handleStartCommand(chatId: number, userId: number, from: TelegramBot.User) {
    // Check if user exists, create if not
    await this.ensureUser(userId, from);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Выбрать товары', callback_data: 'browse_products' }],
          [{ text: '🛒 Моя корзина', callback_data: 'view_cart' }],
          [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
          [{ text: '🔐 Привязать аккаунты', callback_data: 'link_accounts' }]
        ]
      }
    };

    this.bot.sendMessage(chatId, 
      `🛍️ Добро пожаловать в бот для покупок!\n\n` +
      `Я помогу вам совершать покупки на Wildberries и Ozon.\n\n` +
      `• Выберите товары из каталога\n` +
      `• Добавьте их в корзину\n` +
      `• Оформите заказ через маркетплейс\n\n` +
      `Выберите действие:`,
      keyboard
    );
  }

  private async showCart(chatId: number, userId: number) {
    const cart = this.userCarts.get(userId) || [];

    if (cart.length === 0) {
      this.bot.sendMessage(chatId, 
        '🛒 Ваша корзина пуста\n\n' +
        'Выберите товары из каталога, чтобы добавить их в корзину.',
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ К товарам', callback_data: 'browse_products' }]
            ]
          }
        }
      );
      return;
    }

    const cartItems = cart.map(item => 
      `• ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity}₽`
    ).join('\n');

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟣 Оформить на Wildberries', callback_data: 'checkout_wildberries' }],
          [{ text: '🔵 Оформить на Ozon', callback_data: 'checkout_ozon' }],
          [{ text: '🗑 Очистить корзину', callback_data: 'clear_cart' }],
          [{ text: '↩️ Назад', callback_data: '/start' }]
        ]
      }
    };

    this.bot.sendMessage(chatId,
      `🛒 **Ваша корзина:**\n\n${cartItems}\n\n` +
      `💰 **Итого:** ${total}₽`,
      { parse_mode: 'Markdown', ...keyboard }
    );
  }
}
